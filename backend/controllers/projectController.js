const { Project, Task, User } = require("../models");
const {
  formatSuccessResponse,
  formatErrorResponse,
  getPaginationData,
  getSkipValue
} = require("../utils/helpers");

// Get all projects (role-based access)
const getAllProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      priority = ""
    } = req.query;

    // Build query based on user role
    let query = {};
    
    if (req.user.role === "user") {
      // Users can only see projects they're part of
      query["teamMembers.user"] = req.user._id;
    } else if (req.user.role === "moderator") {
      // Moderators see their created projects and projects they're part of
      query.$or = [
        { createdBy: req.user._id },
        { "teamMembers.user": req.user._id }
      ];
    }
    // Admins can see all projects (no additional filter)

    // Apply search filters
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } }
        ]
      });
    }
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }

    // Get total count for pagination
    const totalProjects = await Project.countDocuments(query);
    
    // Get projects with pagination and populate
    const projects = await Project.find(query)
      .populate("createdBy", "name email role")
      .populate("teamMembers.user", "name email role")
      .populate("taskCount completedTaskCount")
      .sort({ createdAt: -1 })
      .skip(getSkipValue(page, limit))
      .limit(parseInt(limit));

    const pagination = getPaginationData(page, limit, totalProjects);

    res.json(
      formatSuccessResponse({
        projects,
        pagination
      }, "Projects retrieved successfully")
    );
  } catch (error) {
    console.error("Get all projects error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to retrieve projects", 500)
    );
  }
};

// Get single project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate("createdBy", "name email role")
      .populate("teamMembers.user", "name email role")
      .populate("taskCount completedTaskCount");
    
    if (!project) {
      return res.status(404).json(
        formatErrorResponse("Project not found", 404)
      );
    }

    // Check access permissions
    const hasAccess = 
      req.user.role === "admin" ||
      project.createdBy._id.toString() === req.user._id.toString() ||
      project.teamMembers.some(member => member.user._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json(
        formatErrorResponse("Access denied to this project", 403)
      );
    }

    // Get project tasks
    const tasks = await Task.find({ projectId: id })
      .populate("assignedTo createdBy", "name email")
      .sort({ priority: -1, dueDate: 1 })
      .limit(20); // Limit to recent tasks

    res.json(
      formatSuccessResponse({
        project,
        tasks
      }, "Project retrieved successfully")
    );
  } catch (error) {
    console.error("Get project by ID error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to retrieve project", 500)
    );
  }
};

// Get all projects (for standard "user" role) the user is a member of, including ONLY tasks assigned to that user
const getAllProjectsForUserWithTasks = async (req, res) => {
  try {
    // Ensure endpoint is only for basic user role (admins/moderators should use existing endpoints)
    if (req.user.role !== 'user') {
      return res.status(403).json(
        formatErrorResponse('Endpoint restricted to user role', 403)
      );
    }

    // Fetch projects where the user is explicitly a team member
    const projects = await Project.find({ 'teamMembers.user': req.user._id })
      .select('_id title description status priority startDate completedDate createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean({ virtuals: true }); // include virtual counts if needed client-side

    if (!projects.length) {
      return res.json(
        formatSuccessResponse({ projects: [] }, 'No projects found for user')
      );
    }

    const projectIds = projects.map(p => p._id);

    // Fetch only tasks assigned to the current user across these projects
    const tasks = await Task.find({
      projectId: { $in: projectIds },
      assignedTo: req.user._id
    })
      .select('_id title status priority category dueDate ticket startDate completedDate projectId createdAt updatedAt')
      .sort({ priority: -1, dueDate: 1 })
      .lean({ virtuals: true });

    // Group tasks by projectId
    const tasksByProject = tasks.reduce((acc, t) => {
      const pid = t.projectId.toString();
      if (!acc[pid]) acc[pid] = [];
      acc[pid].push(t);
      return acc;
    }, {});

    // Shape response: project + tasks (no teamMembers / createdBy leakage)
    const shaped = projects.map(p => ({
      _id: p._id,
      title: p.title,
      description: p.description,
      status: p.status,
      priority: p.priority,
      startDate: p.startDate,
      completedDate: p.completedDate,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      // Provide virtual counts if present (optional)
      taskCount: p.taskCount,
      completedTaskCount: p.completedTaskCount,
      tasks: tasksByProject[p._id.toString()] || []
    }));

    res.json(
      formatSuccessResponse({ projects: shaped }, 'User projects with assigned tasks retrieved successfully')
    );
  } catch (error) {
    console.error('Get user projects with tasks error:', error);
    res.status(500).json(
      formatErrorResponse('Failed to retrieve user projects with tasks', 500)
    );
  }
};

// Create new project (Moderator and Admin only)
const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      priority = "medium",
      teamMembers = [],
      tags = [],
      budget
    } = req.body;

    // Validate team members exist
    if (teamMembers.length > 0) {
      const userIds = teamMembers.map(member => member.user);
      const users = await User.find({ _id: { $in: userIds } });
      
      if (users.length !== userIds.length) {
        return res.status(400).json(
          formatErrorResponse("Some team members do not exist", 400)
        );
      }
    }

    // Create project
    const project = new Project({
      title,
      description,
      priority,
      createdBy: req.user._id,
      teamMembers: teamMembers.map(member => ({
        user: member.user,
        role: member.role || "developer",
        joinedAt: new Date()
      })),
    });

    await project.save();

    // Populate the created project
    const populatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email role")
      .populate("teamMembers.user", "name email role");

    res.status(201).json(
      formatSuccessResponse(populatedProject, "Project created successfully", 201)
    );
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to create project", 500)
    );
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      teamMembers,
    } = req.body;

    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json(
        formatErrorResponse("Project not found", 404)
      );
    }

    // Check permissions
    const isCreator = project.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json(
        formatErrorResponse("You can only update projects you created", 403)
      );
    }

    // Build updates
    const updates = {};
    
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (status) updates.status = status;
    if (priority) updates.priority = priority;

    if (teamMembers) {
      const userIds = teamMembers.map(member => member.user);
      const users = await User.find({ _id: { $in: userIds } });
      
      if (users.length !== userIds.length) {
        return res.status(400).json(
          formatErrorResponse("Some team members do not exist", 400)
        );
      }

      updates.teamMembers = teamMembers.map(member => ({
        user: member.user,
        role: member.role || "developer",
        joinedAt: member.joinedAt || new Date()
      }));
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate("createdBy", "name email role")
      .populate("teamMembers.user", "name email role");

    res.json(
      formatSuccessResponse(updatedProject, "Project updated successfully")
    );
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to update project", 500)
    );
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json(
        formatErrorResponse("Project not found", 404)
      );
    }

    // Check permissions
    const isCreator = project.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json(
        formatErrorResponse("You can only delete projects you created", 403)
      );
    }

    // Check if project has active tasks
    const activeTasks = await Task.countDocuments({
      projectId: id,
      status: { $in: ["open", "in-progress"] }
    });

    if (activeTasks > 0) {
      return res.status(400).json(
        formatErrorResponse("Cannot delete project with active tasks. Complete or cancel all tasks first.", 400)
      );
    }

    await Project.findByIdAndDelete(id);

    res.json(
      formatSuccessResponse(null, "Project deleted successfully")
    );
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to delete project", 500)
    );
  }
};

// Add team member to project
const addTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role = "developer" } = req.body;

    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json(
        formatErrorResponse("Project not found", 404)
      );
    }

    // Check permissions
    const isCreator = project.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json(
        formatErrorResponse("Only project creator or admin can add team members", 403)
      );
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        formatErrorResponse("User not found", 404)
      );
    }

    // Check if user is already a team member
    const isAlreadyMember = project.teamMembers.some(
      member => member.user.toString() === userId
    );

    if (isAlreadyMember) {
      return res.status(400).json(
        formatErrorResponse("User is already a team member", 400)
      );
    }

    // Add team member
    project.teamMembers.push({
      user: userId,
      role,
      joinedAt: new Date()
    });

    await project.save();

    const updatedProject = await Project.findById(id)
      .populate("createdBy", "name email role")
      .populate("teamMembers.user", "name email role");

    res.json(
      formatSuccessResponse(updatedProject, "Team member added successfully")
    );
  } catch (error) {
    console.error("Add team member error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to add team member", 500)
    );
  }
};

// Remove team member from project
const removeTeamMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json(
        formatErrorResponse("Project not found", 404)
      );
    }

    // Check permissions
    const isCreator = project.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json(
        formatErrorResponse("Only project creator or admin can remove team members", 403)
      );
    }

    // Remove team member
    project.teamMembers = project.teamMembers.filter(
      member => member.user.toString() !== userId
    );

    await project.save();

    const updatedProject = await Project.findById(id)
      .populate("createdBy", "name email role")
      .populate("teamMembers.user", "name email role");

    res.json(
      formatSuccessResponse(updatedProject, "Team member removed successfully")
    );
  } catch (error) {
    console.error("Remove team member error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to remove team member", 500)
    );
  }
};

// Get project statistics
const getProjectStats = async (req, res) => {
  try {
    let matchStage = {};
    
    // Apply role-based filtering
    if (req.user.role === "user") {
      matchStage["teamMembers.user"] = req.user._id;
    } else if (req.user.role === "moderator") {
      matchStage.$or = [
        { createdBy: req.user._id },
        { "teamMembers.user": req.user._id }
      ];
    }

    const stats = await Project.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          activeProjects: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, 1, 0]
            }
          },
          completedProjects: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
            }
          },
          onHoldProjects: {
            $sum: {
              $cond: [{ $eq: ["$status", "on-hold"] }, 1, 0]
            }
          },
          avgProgress: { $avg: "$progress" },
          totalBudget: { $sum: "$budget" }
        }
      }
    ]);

    const result = stats[0] || {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      onHoldProjects: 0,
      avgProgress: 0,
      totalBudget: 0
    };

    res.json(
      formatSuccessResponse(result, "Project statistics retrieved successfully")
    );
  } catch (error) {
    console.error("Get project stats error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to retrieve project statistics", 500)
    );
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addTeamMember,
  removeTeamMember,
  getProjectStats,
  getAllProjectsForUserWithTasks
};