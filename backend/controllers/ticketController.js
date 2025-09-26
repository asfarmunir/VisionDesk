const { Ticket, Task, Project } = require("../models");
const {
  formatSuccessResponse,
  formatErrorResponse,
  getPaginationData,
  getSkipValue
} = require("../utils/helpers");

// Get all tickets (role-based access)
const getAllTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "",
      resolution = "",
      resolvedBy = "",
      taskId = ""
    } = req.query;

    // Build base query based on user role
    let query = {};
    
    if (req.user.role === "user") {
      // Users can only see tickets they resolved
      query.resolvedBy = req.user._id;
    } else if (req.user.role === "moderator") {
      // Moderators see tickets from their projects
      const userProjects = await Project.find({
        $or: [
          { createdBy: req.user._id },
          { "teamMembers.user": req.user._id }
        ]
      }).select("_id");
      
      const projectIds = userProjects.map(p => p._id);
      
      // Get tasks from these projects
      const tasks = await Task.find({ projectId: { $in: projectIds } }).select("_id");
      const taskIds = tasks.map(t => t._id);
      
      query.taskId = { $in: taskIds };
    }
    // Admins can see all tickets (no additional filter)

    // Apply filters
    if (status) query.status = status;
    if (resolution) query.resolution = resolution;
    if (resolvedBy) query.resolvedBy = resolvedBy;
    if (taskId) query.taskId = taskId;

    // Get total count for pagination
    const totalTickets = await Ticket.countDocuments(query);
    
    // Get tickets with pagination and populate
    const tickets = await Ticket.find(query)
      .populate({
        path: "taskId",
        select: "title description projectId",
        populate: {
          path: "projectId",
          select: "title"
        }
      })
      .populate("resolvedBy verifiedBy", "name email role")
      .sort({ resolvedAt: -1 })
      .skip(getSkipValue(page, limit))
      .limit(parseInt(limit));

    const pagination = getPaginationData(page, limit, totalTickets);

    res.json(
      formatSuccessResponse({
        tickets,
        pagination
      }, "Tickets retrieved successfully")
    );
  } catch (error) {
    console.error("Get all tickets error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to retrieve tickets", 500)
    );
  }
};

// Get single ticket by ID
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id)
      .populate({
        path: "taskId",
        select: "title description projectId assignedTo createdBy",
        populate: [
          {
            path: "projectId",
            select: "title createdBy teamMembers"
          },
          {
            path: "assignedTo createdBy",
            select: "name email role"
          }
        ]
      })
      .populate("resolvedBy verifiedBy", "name email role");
    
    if (!ticket) {
      return res.status(404).json(
        formatErrorResponse("Ticket not found", 404)
      );
    }

    // Check access permissions
    const task = ticket.taskId;
    const project = task.projectId;
    
    const hasAccess = 
      req.user.role === "admin" ||
      ticket.resolvedBy._id.toString() === req.user._id.toString() ||
      task.assignedTo._id.toString() === req.user._id.toString() ||
      task.createdBy._id.toString() === req.user._id.toString() ||
      project.createdBy.toString() === req.user._id.toString() ||
      project.teamMembers.some(member => member.user.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json(
        formatErrorResponse("Access denied to this ticket", 403)
      );
    }

    res.json(
      formatSuccessResponse(ticket, "Ticket retrieved successfully")
    );
  } catch (error) {
    console.error("Get ticket by ID error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to retrieve ticket", 500)
    );
  }
};

// Create new ticket (resolve task)
const createTicket = async (req, res) => {
  try {
    const {
      taskId,
      title,
      description,
      notes,
      timeSpent,
      resolution = "fixed"
    } = req.body;

    // Validate task exists and user has access
    const task = await Task.findById(taskId).populate("projectId");
    if (!task) {
      return res.status(404).json(
        formatErrorResponse("Task not found", 404)
      );
    }

    // Check if task is assigned to the user or they have project access
    const project = task.projectId;
    const isTaskAssigned = task.assignedTo.toString() === req.user._id.toString();
    const isTaskCreator = task.createdBy.toString() === req.user._id.toString();
    const isProjectCreator = project.createdBy.toString() === req.user._id.toString();
    const isTeamMember = project.teamMembers.some(
      member => member.user.toString() === req.user._id.toString()
    );
    const isAdmin = req.user.role === "admin";

    const canResolve = isTaskAssigned || isTaskCreator || isProjectCreator || isTeamMember || isAdmin;

    if (!canResolve) {
      return res.status(403).json(
        formatErrorResponse("You don't have permission to resolve this task", 403)
      );
    }

    // Check if task is already resolved or closed
    if (task.status === "resolved" || task.status === "closed") {
      return res.status(400).json(
        formatErrorResponse("Task is already resolved or closed", 400)
      );
    }

    // Create ticket
    const ticket = new Ticket({
      taskId,
      title,
      description,
      resolvedBy: req.user._id,
      notes,
      timeSpent,
      resolution,
      status: "pending"
    });

    await ticket.save();

    // Update task status to resolved
    task.status = "resolved";
    task.actualHours = (task.actualHours || 0) + timeSpent;
    await task.save();

    // Populate the created ticket
    const populatedTicket = await Ticket.findById(ticket._id)
      .populate({
        path: "taskId",
        select: "title description projectId",
        populate: {
          path: "projectId",
          select: "title"
        }
      })
      .populate("resolvedBy", "name email role");

    res.status(201).json(
      formatSuccessResponse(populatedTicket, "Ticket created successfully", 201)
    );
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to create ticket", 500)
    );
  }
};

// Verify ticket (Moderator/Admin only)
const verifyTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verificationNotes } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json(
        formatErrorResponse("Status must be 'verified' or 'rejected'", 400)
      );
    }

    const ticket = await Ticket.findById(id).populate({
      path: "taskId",
      populate: {
        path: "projectId",
        select: "createdBy teamMembers"
      }
    });
    
    if (!ticket) {
      return res.status(404).json(
        formatErrorResponse("Ticket not found", 404)
      );
    }

    // Check if ticket is in pending status
    if (ticket.status !== "pending") {
      return res.status(400).json(
        formatErrorResponse("Only pending tickets can be verified", 400)
      );
    }

    // Check permissions (moderator/admin or project creator)
    const project = ticket.taskId.projectId;
    const isProjectCreator = project.createdBy.toString() === req.user._id.toString();
    const isProjectTeamLead = project.teamMembers.some(
      member => member.user.toString() === req.user._id.toString() && 
      member.role === "lead"
    );
    const isModerator = req.user.role === "moderator";
    const isAdmin = req.user.role === "admin";

    const canVerify = isProjectCreator || isProjectTeamLead || isModerator || isAdmin;

    if (!canVerify) {
      return res.status(403).json(
        formatErrorResponse("You don't have permission to verify tickets", 403)
      );
    }

    // Update ticket
    ticket.status = status;
    ticket.verifiedBy = req.user._id;
    ticket.verificationNotes = verificationNotes;
    ticket.verifiedAt = new Date();

    // If rejected, reopen the task
    if (status === "rejected") {
      const task = await Task.findById(ticket.taskId._id);
      task.status = "in-progress"; // Or back to previous status
      await task.save();
    }

    // If verified, close the task
    if (status === "verified") {
      const task = await Task.findById(ticket.taskId._id);
      task.status = "closed";
      await task.save();
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(id)
      .populate({
        path: "taskId",
        select: "title description projectId status",
        populate: {
          path: "projectId",
          select: "title"
        }
      })
      .populate("resolvedBy verifiedBy", "name email role");

    res.json(
      formatSuccessResponse(updatedTicket, `Ticket ${status} successfully`)
    );
  } catch (error) {
    console.error("Verify ticket error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to verify ticket", 500)
    );
  }
};

// Update ticket
const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      notes,
      timeSpent,
      resolution
    } = req.body;

    const ticket = await Ticket.findById(id).populate({
      path: "taskId",
      populate: {
        path: "projectId",
        select: "createdBy teamMembers"
      }
    });
    
    if (!ticket) {
      return res.status(404).json(
        formatErrorResponse("Ticket not found", 404)
      );
    }

    // Check if ticket can be updated (only pending tickets by resolver)
    if (ticket.status !== "pending") {
      return res.status(400).json(
        formatErrorResponse("Only pending tickets can be updated", 400)
      );
    }

    // Check permissions (resolver, moderator, admin, or project creator)
    const project = ticket.taskId.projectId;
    const isResolver = ticket.resolvedBy.toString() === req.user._id.toString();
    const isProjectCreator = project.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isModerator = req.user.role === "moderator";

    const canUpdate = isResolver || isProjectCreator || isAdmin || isModerator;

    if (!canUpdate) {
      return res.status(403).json(
        formatErrorResponse("You don't have permission to update this ticket", 403)
      );
    }

    // Build updates
    const updates = {};
    
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (notes) updates.notes = notes;
    if (typeof timeSpent === "number") updates.timeSpent = timeSpent;
    if (resolution) updates.resolution = resolution;

    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate({
        path: "taskId",
        select: "title description projectId",
        populate: {
          path: "projectId",
          select: "title"
        }
      })
      .populate("resolvedBy verifiedBy", "name email role");

    res.json(
      formatSuccessResponse(updatedTicket, "Ticket updated successfully")
    );
  } catch (error) {
    console.error("Update ticket error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to update ticket", 500)
    );
  }
};

// Delete ticket
const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id).populate({
      path: "taskId",
      populate: {
        path: "projectId",
        select: "createdBy teamMembers"
      }
    });
    
    if (!ticket) {
      return res.status(404).json(
        formatErrorResponse("Ticket not found", 404)
      );
    }

    // Check permissions (resolver, admin, or project creator)
    const project = ticket.taskId.projectId;
    const isResolver = ticket.resolvedBy.toString() === req.user._id.toString();
    const isProjectCreator = project.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    const canDelete = isResolver || isProjectCreator || isAdmin;

    if (!canDelete) {
      return res.status(403).json(
        formatErrorResponse("You don't have permission to delete this ticket", 403)
      );
    }

    // Only allow deletion of pending or rejected tickets
    if (!["pending", "rejected"].includes(ticket.status)) {
      return res.status(400).json(
        formatErrorResponse("Only pending or rejected tickets can be deleted", 400)
      );
    }

    // Reopen the task if ticket is deleted
    const task = await Task.findById(ticket.taskId._id);
    if (task.status === "resolved" || task.status === "closed") {
      task.status = "in-progress";
      await task.save();
    }

    await Ticket.findByIdAndDelete(id);

    res.json(
      formatSuccessResponse(null, "Ticket deleted successfully")
    );
  } catch (error) {
    console.error("Delete ticket error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to delete ticket", 500)
    );
  }
};

// Close ticket (Final action by moderator/admin)
const closeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { closureNotes } = req.body;

    const ticket = await Ticket.findById(id).populate({
      path: "taskId",
      populate: {
        path: "projectId",
        select: "createdBy teamMembers"
      }
    });
    
    if (!ticket) {
      return res.status(404).json(
        formatErrorResponse("Ticket not found", 404)
      );
    }

    // Only verified tickets can be closed
    if (ticket.status !== "verified") {
      return res.status(400).json(
        formatErrorResponse("Only verified tickets can be closed", 400)
      );
    }

    // Check permissions
    const project = ticket.taskId.projectId;
    const isProjectCreator = project.createdBy.toString() === req.user._id.toString();
    const isModerator = req.user.role === "moderator";
    const isAdmin = req.user.role === "admin";

    const canClose = isProjectCreator || isModerator || isAdmin;

    if (!canClose) {
      return res.status(403).json(
        formatErrorResponse("You don't have permission to close tickets", 403)
      );
    }

    // Close ticket
    ticket.status = "closed";
    ticket.closedAt = new Date();
    if (closureNotes) {
      ticket.verificationNotes = ticket.verificationNotes 
        ? `${ticket.verificationNotes}\n\nClosure Notes: ${closureNotes}`
        : `Closure Notes: ${closureNotes}`;
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(id)
      .populate({
        path: "taskId",
        select: "title description projectId status",
        populate: {
          path: "projectId",
          select: "title"
        }
      })
      .populate("resolvedBy verifiedBy", "name email role");

    res.json(
      formatSuccessResponse(updatedTicket, "Ticket closed successfully")
    );
  } catch (error) {
    console.error("Close ticket error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to close ticket", 500)
    );
  }
};

// Get ticket statistics
const getTicketStats = async (req, res) => {
  try {
    let matchStage = {};
    
    // Apply role-based filtering
    if (req.user.role === "user") {
      matchStage.resolvedBy = req.user._id;
    } else if (req.user.role === "moderator") {
      // Get projects the moderator has access to
      const userProjects = await Project.find({
        $or: [
          { createdBy: req.user._id },
          { "teamMembers.user": req.user._id }
        ]
      }).select("_id");
      
      const projectIds = userProjects.map(p => p._id);
      
      // Get tasks from these projects
      const tasks = await Task.find({ projectId: { $in: projectIds } }).select("_id");
      const taskIds = tasks.map(t => t._id);
      
      matchStage.taskId = { $in: taskIds };
    }

    const stats = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          pendingTickets: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0]
            }
          },
          verifiedTickets: {
            $sum: {
              $cond: [{ $eq: ["$status", "verified"] }, 1, 0]
            }
          },
          rejectedTickets: {
            $sum: {
              $cond: [{ $eq: ["$status", "rejected"] }, 1, 0]
            }
          },
          closedTickets: {
            $sum: {
              $cond: [{ $eq: ["$status", "closed"] }, 1, 0]
            }
          },
          avgTimeSpent: { $avg: "$timeSpent" },
          totalTimeSpent: { $sum: "$timeSpent" }
        }
      }
    ]);

    // Get resolution type statistics
    const resolutionStats = await Ticket.aggregate([
      { $match: { ...matchStage, resolution: { $exists: true } } },
      {
        $group: {
          _id: "$resolution",
          count: { $sum: 1 }
        }
      }
    ]);

    const result = stats[0] || {
      totalTickets: 0,
      pendingTickets: 0,
      verifiedTickets: 0,
      rejectedTickets: 0,
      closedTickets: 0,
      avgTimeSpent: 0,
      totalTimeSpent: 0
    };

    result.resolutionBreakdown = resolutionStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json(
      formatSuccessResponse(result, "Ticket statistics retrieved successfully")
    );
  } catch (error) {
    console.error("Get ticket stats error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to retrieve ticket statistics", 500)
    );
  }
};

module.exports = {
  getAllTickets,
  getTicketById,
  createTicket,
  verifyTicket,
  updateTicket,
  deleteTicket,
  closeTicket,
  getTicketStats
};