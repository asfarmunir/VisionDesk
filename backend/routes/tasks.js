const express = require("express");
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  getTaskStats
} = require("../controllers/taskController");
const { authenticate, isModerator, canAccessTask } = require("../middleware/auth");
const {
  validateTaskCreation,
  validateTaskUpdate,
  handleValidationErrors
} = require("../utils/validators");
const { body, param } = require("express-validator");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/tasks - Get all tasks (role-based access)
router.get("/", getAllTasks);

// GET /api/tasks/stats - Get task statistics
router.get("/stats", getTaskStats);

// GET /api/tasks/:id - Get single task
router.get("/:id",
  [
    param("id").isMongoId().withMessage("Invalid task ID"),
    handleValidationErrors
  ],
  canAccessTask,
  getTaskById
);

// POST /api/tasks - Create new task (Moderator and Admin only, or project team members)
router.post("/", isModerator, validateTaskCreation, createTask);

// PUT /api/tasks/:id - Update task
router.put("/:id",
  [
    param("id").isMongoId().withMessage("Invalid task ID"),
    handleValidationErrors
  ],
  canAccessTask,
  validateTaskUpdate,
  updateTask
);

// DELETE /api/tasks/:id - Delete task
router.delete("/:id",
  [
    param("id").isMongoId().withMessage("Invalid task ID"),
    handleValidationErrors
  ],
  canAccessTask,
  deleteTask
);

// POST /api/tasks/:id/comments - Add comment to task
router.post("/:id/comments",
  [
    param("id").isMongoId().withMessage("Invalid task ID"),
    body("content")
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("Comment must be between 1 and 500 characters"),
    handleValidationErrors
  ],
  canAccessTask,
  addComment
);

module.exports = router;