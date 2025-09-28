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

router.use(authenticate);

router.get("/",  getAllUsers);

router.get("/stats", isAdmin, getUserStats);

router.get("/:id", 
  isOwnerOrModerator((req) => req.params.id),
  getUserById
);

router.post("/", isAdmin, validateUserRegistration, createUser);

router.put("/:id", 
  isOwnerOrModerator((req) => req.params.id),
  validateUserUpdate,
  updateUser
);

router.delete("/:id", isAdmin, deleteUser);

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