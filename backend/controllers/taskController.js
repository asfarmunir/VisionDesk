const { Task, Project, User } = require("../models");
const {
  formatSuccessResponse,
  formatErrorResponse,
  getPaginationData,
  getSkipValue
} = require("../utils/helpers");

// Get all tasks (role-based access)
const getAllTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      priority = "",
      projectId = "",
      assignedTo = "",
      dueDate = ""
    } = req.query;

    // Build base query based on user role
    let query = {};
    
    if (req.user.role === "user") {
      // Users can only see tasks assigned to them
      query.assignedTo = req.user._id;
    } else if (req.user.role === "moderator") {
      // Moderators see tasks from their projects
      const userProjects = await Project.find({
        $or: [
          { createdBy: req.user._id },
          { "teamMembers.user": req.user._id }
        ]
      }).select("_id");
      
      const projectIds = userProjects.map(p => p._id);
      query.projectId = { $in: projectIds };
    }
    // Admins can see all tasks (no additional filter)

    // Apply filters
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } }
        ]
      });
    }
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (projectId) query.projectId = projectId;
    if (assignedTo) query.assignedTo = assignedTo;
    
    if (dueDate) {
      const date = new Date(dueDate);
      query.dueDate = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      };
    }

    // Get total count for pagination
    const totalTasks = await Task.countDocuments(query);
    
    // Get tasks with pagination and populate
    const tasks = await Task.find(query)
      .populate("projectId", "title status")
      .populate("assignedTo createdBy", "name email role")
      .sort({ priority: -1, dueDate: 1 })
      .skip(getSkipValue(page, limit))
      .limit(parseInt(limit));

    const pagination = getPaginationData(page, limit, totalTasks);

    res.json(
      formatSuccessResponse({
        tasks,
        pagination
      }, "Tasks retrieved successfully")
    );
  } catch (error) {
    console.error("Get all tasks error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to retrieve tasks", 500)
    );
  }
};

// Get single task by ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate("projectId", "title status createdBy teamMembers")
      .populate("assignedTo createdBy", "name email role")
      .populate("comments.author", "name email");
    
    if (!task) {
      return res.status(404).json(
        formatErrorResponse("Task not found", 404)
      );
    }

    // Check access permissions
    const project = task.projectId;
    const hasAccess = 
      req.user.role === "admin" ||
      task.assignedTo._id.toString() === req.user._id.toString() ||
      task.createdBy._id.toString() === req.user._id.toString() ||
      project.createdBy.toString() === req.user._id.toString() ||
      project.teamMembers.some(member => member.user.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json(
        formatErrorResponse("Access denied to this task", 403)
      );
    }

    // Return task (tickets model removed; ticket info now inline on task)
    res.json(
      formatSuccessResponse({ task }, "Task retrieved successfully")
    );
  } catch (error) {
    console.error("Get task by ID error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to retrieve task", 500)
    );
  }
};

// Create new task (Moderator and Admin only)
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      assignedTo,
      dueDate,
      priority = "medium",
      category = "feature",
    } = req.body;

    // Validate project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json(
        formatErrorResponse("Project not found", 404)
      );
    }

    // Check permissions to create tasks in this project
    const isProjectCreator = project.createdBy.toString() === req.user._id.toString();
    const isTeamMember = project.teamMembers.some(
      member => member.user.toString() === req.user._id.toString()
    );
    const isAdmin = req.user.role === "admin";

    if (!isProjectCreator && !isTeamMember && !isAdmin) {
      return res.status(403).json(
        formatErrorResponse("You don't have permission to create tasks in this project", 403)
      );
    }

    // Validate assigned user exists and has access to project
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json(
        formatErrorResponse("Assigned user not found", 404)
      );
    }

    const canAssignToUser = 
      assignedUser.role === "admin" ||
      project.createdBy.toString() === assignedTo ||
      project.teamMembers.some(member => member.user.toString() === assignedTo);

    if (!canAssignToUser) {
      return res.status(400).json(
        formatErrorResponse("User is not part of this project", 400)
      );
    }

    // Create task
    const task = new Task({
      title,
      description,
      projectId,
      assignedTo,
      createdBy: req.user._id,
      priority,
      category,
      dueDate
      
    });

    await task.save();

    // Populate the created task
    const populatedTask = await Task.findById(task._id)
      .populate("projectId", "title status")
      .populate("assignedTo createdBy", "name email role");

    res.status(201).json(
      formatSuccessResponse(populatedTask, "Task created successfully", 201)
    );
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to create task", 500)
    );
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      category,
      ticket
    } = req.body;

    const task = await Task.findById(id).populate("projectId");
    
    if (!task) {
      return res.status(404).json(
        formatErrorResponse("Task not found", 404)
      );
    }

    // Check permissions
    const project = task.projectId;
    const isTaskAssigned = task.assignedTo.toString() === req.user._id.toString();
    const isTaskCreator = task.createdBy.toString() === req.user._id.toString();
    const isProjectCreator = project.createdBy.toString() === req.user._id.toString();
    const isTeamMember = project.teamMembers.some(
      member => member.user.toString() === req.user._id.toString()
    );
    const isAdmin = req.user.role === "admin";

    const canUpdate = isTaskAssigned || isTaskCreator || isProjectCreator || isTeamMember || isAdmin;

    if (!canUpdate) {
      return res.status(403).json(
        formatErrorResponse("You don't have permission to update this task", 403)
      );
    }

    // Build updates
    const updates = {};
    
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (priority) updates.priority = priority;
    if (dueDate) updates.dueDate = dueDate;
    if (category) updates.category = category;
    if (ticket) updates.ticket = ticket;

    if (status && (isTaskAssigned || isTaskCreator || isProjectCreator || isAdmin)) {
      updates.status = status;
    }

    // Only moderators and admins can reassign tasks
    if (assignedTo && (isProjectCreator || isAdmin || req.user.role === "moderator")) {
      // Validate new assigned user
      const newAssignedUser = await User.findById(assignedTo);
      if (!newAssignedUser) {
        return res.status(404).json(
          formatErrorResponse("New assigned user not found", 404)
        );
      }

      const canAssignToUser = 
        newAssignedUser.role === "admin" ||
        project.createdBy.toString() === assignedTo ||
        project.teamMembers.some(member => member.user.toString() === assignedTo);

      if (!canAssignToUser) {
        return res.status(400).json(
          formatErrorResponse("User is not part of this project", 400)
        );
      }

      updates.assignedTo = assignedTo;
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate("projectId", "title status")
      .populate("assignedTo createdBy", "name email role");

    res.json(
      formatSuccessResponse(updatedTask, "Task updated successfully")
    );
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to update task", 500)
    );
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id).populate("projectId");
    
    if (!task) {
      return res.status(404).json(
        formatErrorResponse("Task not found", 404)
      );
    }

    // Check permissions (only creator, project creator, or admin can delete)
    const project = task.projectId;
    const isTaskCreator = task.createdBy.toString() === req.user._id.toString();
    const isProjectCreator = project.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isTaskCreator && !isProjectCreator && !isAdmin) {
      return res.status(403).json(
        formatErrorResponse("You don't have permission to delete this task", 403)
      );
    }

    await Task.findByIdAndDelete(id);

    res.json(
      formatSuccessResponse(null, "Task deleted successfully")
    );
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to delete task", 500)
    );
  }
};

// Add comment to task
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const task = await Task.findById(id).populate("projectId");
    
    if (!task) {
      return res.status(404).json(
        formatErrorResponse("Task not found", 404)
      );
    }

    // Check access permissions (same as viewing task)
    const project = task.projectId;
    const hasAccess = 
      req.user.role === "admin" ||
      task.assignedTo.toString() === req.user._id.toString() ||
      task.createdBy.toString() === req.user._id.toString() ||
      project.createdBy.toString() === req.user._id.toString() ||
      project.teamMembers.some(member => member.user.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json(
        formatErrorResponse("Access denied to this task", 403)
      );
    }

    // Add comment
    task.comments.push({
      author: req.user._id,
      content,
      createdAt: new Date()
    });

    await task.save();

    const updatedTask = await Task.findById(id)
      .populate("projectId", "title status")
      .populate("assignedTo createdBy", "name email role")
      .populate("comments.author", "name email");

    res.json(
      formatSuccessResponse(updatedTask, "Comment added successfully")
    );
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to add comment", 500)
    );
  }
};

// Get task statistics
const getTaskStats = async (req, res) => {
  try {
    let matchStage = {};
    
    // Apply role-based filtering
    if (req.user.role === "user") {
      matchStage.assignedTo = req.user._id;
    } else if (req.user.role === "moderator") {
      // Get projects the moderator has access to
      const userProjects = await Project.find({
        $or: [
          { createdBy: req.user._id },
          { "teamMembers.user": req.user._id }
        ]
      }).select("_id");
      
      const projectIds = userProjects.map(p => p._id);
      matchStage.projectId = { $in: projectIds };
    }

    const stats = await Task.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          openTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "open"] }, 1, 0]
            }
          },
          inProgressTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0]
            }
          },
          approvedTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "approved"] }, 1, 0]
            }
          },
          closedTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "closed"] }, 1, 0]
            }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ["$dueDate", new Date()] },
                    { $not: [{ $in: ["$status", ["approved", "closed"]] }] }
                  ]
                },
                1,
                0
              ]
            }
          },
          avgEstimatedHours: { $avg: "$estimatedHours" },
          avgActualHours: { $avg: "$actualHours" }
        }
      }
    ]);

    const result = stats[0] || {
      totalTasks: 0,
      openTasks: 0,
      inProgressTasks: 0,
      approvedTasks: 0,
      closedTasks: 0,
      overdueTasks: 0,
      avgEstimatedHours: 0,
      avgActualHours: 0
    };

    res.json(
      formatSuccessResponse(result, "Task statistics retrieved successfully")
    );
  } catch (error) {
    console.error("Get task stats error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to retrieve task statistics", 500)
    );
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  getTaskStats
};