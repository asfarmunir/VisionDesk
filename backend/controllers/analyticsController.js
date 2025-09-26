const { User, Project, Task, Ticket } = require("../models");
const {
  formatSuccessResponse,
  formatErrorResponse
} = require("../utils/helpers");

// Get comprehensive dashboard analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    const { timeFrame = "30d" } = req.query; // 7d, 30d, 90d, 1y
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeFrame) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build role-based filters
    let projectFilter = {};
    let taskFilter = {};
    let ticketFilter = {};

    if (req.user.role === "user") {
      // Users see only their assigned tasks and related data
      taskFilter.assignedTo = req.user._id;
      ticketFilter.resolvedBy = req.user._id;
      
      // Get projects where user is a team member
      const userProjects = await Project.find({
        "teamMembers.user": req.user._id
      }).select("_id");
      const projectIds = userProjects.map(p => p._id);
      projectFilter._id = { $in: projectIds };
      
    } else if (req.user.role === "moderator") {
      // Moderators see their projects and related data
      const userProjects = await Project.find({
        $or: [
          { createdBy: req.user._id },
          { "teamMembers.user": req.user._id }
        ]
      }).select("_id");
      const projectIds = userProjects.map(p => p._id);
      
      projectFilter._id = { $in: projectIds };
      taskFilter.projectId = { $in: projectIds };
      
      // Get tasks from these projects for ticket filter
      const tasks = await Task.find({ projectId: { $in: projectIds } }).select("_id");
      const taskIds = tasks.map(t => t._id);
      ticketFilter.taskId = { $in: taskIds };
    }
    // Admins see everything (no filters needed)

    // Get project analytics
    const projectStats = await Project.aggregate([
      { $match: { ...projectFilter, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          activeProjects: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          },
          completedProjects: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          onHoldProjects: {
            $sum: { $cond: [{ $eq: ["$status", "on-hold"] }, 1, 0] }
          },
          averageProgress: { $avg: "$progress" }
        }
      }
    ]);

    // Get project status distribution over time
    const projectTrend = await Project.aggregate([
      { $match: { ...projectFilter, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // Get task analytics
    const taskStats = await Task.aggregate([
      { $match: { ...taskFilter, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          openTasks: {
            $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] }
          },
          resolvedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
          },
          closedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ["$dueDate", now] },
                    { $nin: ["$status", ["resolved", "closed"]] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Get task distribution by priority
    const taskPriorityStats = await Task.aggregate([
      { $match: { ...taskFilter, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get ticket analytics
    const ticketStats = await Ticket.aggregate([
      { $match: { ...ticketFilter, resolvedAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          pendingTickets: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          verifiedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "verified"] }, 1, 0] }
          },
          rejectedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
          },
          closedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] }
          },
          totalTimeSpent: { $sum: "$timeSpent" },
          averageTimeSpent: { $avg: "$timeSpent" }
        }
      }
    ]);

    // Get ticket resolution types
    const resolutionStats = await Ticket.aggregate([
      { $match: { ...ticketFilter, resolvedAt: { $gte: startDate }, resolution: { $exists: true } } },
      {
        $group: {
          _id: "$resolution",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get user performance (for moderators and admins)
    let userPerformance = null;
    if (req.user.role !== "user") {
      let userTaskFilter = taskFilter;
      let userTicketFilter = ticketFilter;

      userPerformance = await Task.aggregate([
        { $match: { ...userTaskFilter, updatedAt: { $gte: startDate } } },
        {
          $group: {
            _id: "$assignedTo",
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0] }
            },
            averageActualHours: { $avg: "$actualHours" }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $project: {
            _id: 1,
            totalTasks: 1,
            completedTasks: 1,
            completionRate: {
              $cond: [
                { $eq: ["$totalTasks", 0] },
                0,
                { $divide: ["$completedTasks", "$totalTasks"] }
              ]
            },
            averageActualHours: 1,
            userName: { $arrayElemAt: ["$user.name", 0] },
            userEmail: { $arrayElemAt: ["$user.email", 0] }
          }
        },
        { $sort: { completionRate: -1 } },
        { $limit: 10 }
      ]);
    }

    // Get recent activities
    const recentActivities = await Task.aggregate([
      { $match: { ...taskFilter, updatedAt: { $gte: startDate } } },
      { $sort: { updatedAt: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedUser"
        }
      },
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project"
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          status: 1,
          priority: 1,
          updatedAt: 1,
          assignedUser: { $arrayElemAt: ["$assignedUser.name", 0] },
          projectTitle: { $arrayElemAt: ["$project.title", 0] }
        }
      }
    ]);

    // Compile response
    const analytics = {
      timeFrame,
      projects: {
        stats: projectStats[0] || {
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          onHoldProjects: 0,
          averageProgress: 0
        },
        trend: projectTrend
      },
      tasks: {
        stats: taskStats[0] || {
          totalTasks: 0,
          openTasks: 0,
          inProgressTasks: 0,
          resolvedTasks: 0,
          closedTasks: 0,
          overdueTasks: 0
        },
        priorityDistribution: taskPriorityStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      tickets: {
        stats: ticketStats[0] || {
          totalTickets: 0,
          pendingTickets: 0,
          verifiedTickets: 0,
          rejectedTickets: 0,
          closedTickets: 0,
          totalTimeSpent: 0,
          averageTimeSpent: 0
        },
        resolutionDistribution: resolutionStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      userPerformance,
      recentActivities
    };

    res.json(
      formatSuccessResponse(analytics, "Dashboard analytics retrieved successfully")
    );
  } catch (error) {
    console.error("Get dashboard analytics error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to retrieve dashboard analytics", 500)
    );
  }
};

// Get project completion rates over time
const getProjectCompletionTrend = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Build role-based filter
    let projectFilter = {};
    if (req.user.role === "user") {
      projectFilter["teamMembers.user"] = req.user._id;
    } else if (req.user.role === "moderator") {
      projectFilter.$or = [
        { createdBy: req.user._id },
        { "teamMembers.user": req.user._id }
      ];
    }

    const completionTrend = await Project.aggregate([
      { 
        $match: { 
          ...projectFilter,
          $or: [
            { completedDate: { $gte: startDate } },
            { createdAt: { $gte: startDate } }
          ]
        } 
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $ifNull: ["$completedDate", "$createdAt"] }
            }
          },
          status: 1,
          progress: 1
        }
      },
      {
        $group: {
          _id: "$date",
          totalProjects: { $sum: 1 },
          completedProjects: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          averageProgress: { $avg: "$progress" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json(
      formatSuccessResponse(completionTrend, "Project completion trend retrieved successfully")
    );
  } catch (error) {
    console.error("Get project completion trend error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to retrieve project completion trend", 500)
    );
  }
};

// Get team performance analytics (Moderator and Admin only)
const getTeamPerformance = async (req, res) => {
  try {
    // Only moderators and admins can view team performance
    if (req.user.role === "user") {
      return res.status(403).json(
        formatErrorResponse("Access denied", 403)
      );
    }

    const { projectId, timeFrame = "30d" } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeFrame) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build filters
    let taskFilter = { updatedAt: { $gte: startDate } };
    
    if (projectId) {
      taskFilter.projectId = projectId;
    } else if (req.user.role === "moderator") {
      // Moderators see only their projects
      const userProjects = await Project.find({
        $or: [
          { createdBy: req.user._id },
          { "teamMembers.user": req.user._id }
        ]
      }).select("_id");
      const projectIds = userProjects.map(p => p._id);
      taskFilter.projectId = { $in: projectIds };
    }

    const teamPerformance = await Task.aggregate([
      { $match: taskFilter },
      {
        $group: {
          _id: "$assignedTo",
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ["$dueDate", now] },
                    { $nin: ["$status", ["resolved", "closed"]] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalEstimatedHours: { $sum: "$estimatedHours" },
          totalActualHours: { $sum: "$actualHours" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $project: {
          _id: 1,
          totalTasks: 1,
          completedTasks: 1,
          inProgressTasks: 1,
          overdueTasks: 1,
          completionRate: {
            $cond: [
              { $eq: ["$totalTasks", 0] },
              0,
              { $multiply: [{ $divide: ["$completedTasks", "$totalTasks"] }, 100] }
            ]
          },
          efficiency: {
            $cond: [
              { $eq: ["$totalEstimatedHours", 0] },
              0,
              { $multiply: [{ $divide: ["$totalEstimatedHours", "$totalActualHours"] }, 100] }
            ]
          },
          totalEstimatedHours: 1,
          totalActualHours: 1,
          user: { $arrayElemAt: ["$user", 0] }
        }
      },
      { $sort: { completionRate: -1 } }
    ]);

    res.json(
      formatSuccessResponse(teamPerformance, "Team performance analytics retrieved successfully")
    );
  } catch (error) {
    console.error("Get team performance error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to retrieve team performance analytics", 500)
    );
  }
};

module.exports = {
  getDashboardAnalytics,
  getProjectCompletionTrend,
  getTeamPerformance
};