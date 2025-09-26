const { body, validationResult } = require("express-validator");

// Validation middleware to check for validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .optional()
    .isIn(["admin", "moderator", "user"])
    .withMessage("Role must be admin, moderator, or user"),
  handleValidationErrors
];

const validateUserLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  handleValidationErrors
];

const validateUserUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("role")
    .optional()
    .isIn(["admin", "moderator", "user"])
    .withMessage("Role must be admin, moderator, or user"),
  handleValidationErrors
];

// Project validation rules
const validateProjectCreation = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Project title must be between 3 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Project description must be between 10 and 1000 characters"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),
  body("teamMembers")
    .optional()
    .isArray()
    .withMessage("Team members must be an array"),
  handleValidationErrors
];

const validateProjectUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Project title must be between 3 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Project description must be between 10 and 1000 characters"),
  body("status")
    .optional()
    .isIn(["active", "completed", "on-hold", "cancelled"])
    .withMessage("Status must be active, completed, on-hold, or cancelled"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),
  handleValidationErrors
];

// Task validation rules
const validateTaskCreation = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Task title must be between 3 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Task description must be between 5 and 500 characters"),
  body("projectId")
    .isMongoId()
    .withMessage("Valid project ID is required"),
  body("assignedTo")
    .isMongoId()
    .withMessage("Valid assigned user ID is required"),
  body("dueDate")
    .isISO8601()
    .toDate()
    .withMessage("Due date must be a valid date"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),
  body("category")
    .optional()
    .isIn(["bug", "feature", "enhancement", "maintenance", "documentation"])
    .withMessage("Category must be bug, feature, enhancement, maintenance, or documentation"),
  handleValidationErrors
];

const validateTaskUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Task title must be between 3 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Task description must be between 5 and 500 characters"),
  body("status")
    .optional()
    .isIn(["open", "in-progress", "resolved", "closed", "cancelled"])
    .withMessage("Status must be open, in-progress, resolved, closed, or cancelled"),
  body("assignedTo")
    .optional()
    .isMongoId()
    .withMessage("Valid assigned user ID is required"),
  body("dueDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Due date must be a valid date"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),
  handleValidationErrors
];



module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateProjectCreation,
  validateProjectUpdate,
  validateTaskCreation,
  validateTaskUpdate,
};