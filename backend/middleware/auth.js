const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { formatErrorResponse } = require("../utils/helpers");

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(
        formatErrorResponse("Access denied. No token provided.", 401)
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user || !user.isActive) {
      return res.status(401).json(
        formatErrorResponse("Invalid token or user not found.", 401)
      );
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json(
        formatErrorResponse("Invalid token.", 401)
      );
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json(
        formatErrorResponse("Token expired.", 401)
      );
    }
    
    console.error("Authentication error:", error);
    return res.status(500).json(
      formatErrorResponse("Server error during authentication.", 500)
    );
  }
};

// Authorization middleware - check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        formatErrorResponse("Authentication required.", 401)
      );
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        formatErrorResponse("Access denied. Insufficient permissions.", 403)
      );
    }

    next();
  };
};

// Middleware to check if user is admin
const isAdmin = authorize("admin");

// Middleware to check if user is moderator or admin
const isModerator = authorize("admin", "moderator");

// Middleware to check if user owns the resource or has admin/moderator role
const isOwnerOrModerator = (getResourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        formatErrorResponse("Authentication required.", 401)
      );
    }

    // Admin and moderators can access any resource
    if (req.user.role === "admin" || req.user.role === "moderator") {
      return next();
    }

    // Get the user ID from the resource (could be from params, body, or query)
    const resourceUserId = getResourceUserId(req);
    
    if (req.user._id.toString() === resourceUserId) {
      return next();
    }

    return res.status(403).json(
      formatErrorResponse("Access denied. You can only access your own resources.", 403)
    );
  };
};

// Middleware to check if user can access project resources
const canAccessProject = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json(
        formatErrorResponse("Authentication required.", 401)
      );
    }

    // Admin can access any project
    if (req.user.role === "admin") {
      return next();
    }

    const projectId = req.params.id || req.body.projectId;
    if (!projectId) {
      return res.status(400).json(
        formatErrorResponse("Project ID is required.", 400)
      );
    }

    const { Project } = require("../models");
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json(
        formatErrorResponse("Project not found.", 404)
      );
    }

    // Check if user is the creator or team member
    const isCreator = project.createdBy.toString() === req.user._id.toString();
    const isTeamMember = project.teamMembers.some(
      member => member.user.toString() === req.user._id.toString()
    );

    if (isCreator || isTeamMember) {
      return next();
    }

    return res.status(403).json(
      formatErrorResponse("Access denied. You don't have access to this project.", 403)
    );
  } catch (error) {
    console.error("Project access check error:", error);
    return res.status(500).json(
      formatErrorResponse("Server error during project access check.", 500)
    );
  }
};

// Middleware to check if user can access task resources
const canAccessTask = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json(
        formatErrorResponse("Authentication required.", 401)
      );
    }

    // Admin can access any task
    if (req.user.role === "admin") {
      return next();
    }

    const taskId = req.params.id || req.body.taskId;
    if (!taskId) {
      return res.status(400).json(
        formatErrorResponse("Task ID is required.", 400)
      );
    }

    const { Task, Project } = require("../models");
    const task = await Task.findById(taskId).populate("projectId");
    
    if (!task) {
      return res.status(404).json(
        formatErrorResponse("Task not found.", 404)
      );
    }

    // Check if user is assigned to the task
    const isAssigned = task.assignedTo.toString() === req.user._id.toString();
    
    // Check if user is the task creator
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    
    // Check if user has access to the project
    const project = task.projectId;
    const isProjectCreator = project.createdBy.toString() === req.user._id.toString();
    const isProjectTeamMember = project.teamMembers.some(
      member => member.user.toString() === req.user._id.toString()
    );

    if (isAssigned || isCreator || isProjectCreator || isProjectTeamMember) {
      return next();
    }

    return res.status(403).json(
      formatErrorResponse("Access denied. You don't have access to this task.", 403)
    );
  } catch (error) {
    console.error("Task access check error:", error);
    return res.status(500).json(
      formatErrorResponse("Server error during task access check.", 500)
    );
  }
};

// Optional authentication - for routes that can work with or without auth
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash");
    
    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  isAdmin,
  isModerator,
  isOwnerOrModerator,
  canAccessProject,
  canAccessTask,
  optionalAuth
};