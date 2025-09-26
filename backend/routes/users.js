const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  assignRole
} = require("../controllers/userController");
const { authenticate, isAdmin, isOwnerOrModerator } = require("../middleware/auth");
const {
  validateUserRegistration,
  validateUserUpdate,
  handleValidationErrors
} = require("../utils/validators");
const { body } = require("express-validator");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users - Get all users (Admin only)
router.get("/", isAdmin, getAllUsers);

// GET /api/users/stats - Get user statistics (Admin only)
router.get("/stats", isAdmin, getUserStats);

// GET /api/users/:id - Get single user (Admin or own profile)
router.get("/:id", 
  isOwnerOrModerator((req) => req.params.id),
  getUserById
);

// POST /api/users - Create new user (Admin only)
router.post("/", isAdmin, validateUserRegistration, createUser);

// PUT /api/users/:id - Update user (Admin or own profile)
router.put("/:id", 
  isOwnerOrModerator((req) => req.params.id),
  validateUserUpdate,
  updateUser
);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete("/:id", isAdmin, deleteUser);

// PUT /api/users/:id/role - Assign role to user (Admin only)
router.put("/:id/role",
  isAdmin,
  [
    body("role")
      .isIn(["admin", "moderator", "user"])
      .withMessage("Role must be admin, moderator, or user"),
    handleValidationErrors
  ],
  assignRole
);

module.exports = router;