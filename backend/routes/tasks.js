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

router.use(authenticate);

router.get("/", getAllTasks);

router.get("/stats", getTaskStats);

router.get("/:id",
  [
    param("id").isMongoId().withMessage("Invalid task ID"),
    handleValidationErrors
  ],
  canAccessTask,
  getTaskById
);

router.post("/", isModerator, validateTaskCreation, createTask);

router.put("/:id",
  [
    param("id").isMongoId().withMessage("Invalid task ID"),
    handleValidationErrors
  ],
  canAccessTask,
  validateTaskUpdate,
  updateTask
);

router.delete("/:id",
  [
    param("id").isMongoId().withMessage("Invalid task ID"),
    handleValidationErrors
  ],
  canAccessTask,
  deleteTask
);


module.exports = router;