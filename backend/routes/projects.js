const express = require("express");
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addTeamMember,
  removeTeamMember,
  getProjectStats,
  getAllProjectsForUserWithTasks
} = require("../controllers/projectController");
const { authenticate, isModerator, canAccessProject } = require("../middleware/auth");
const {
  validateProjectCreation,
  validateProjectUpdate,
  handleValidationErrors
} = require("../utils/validators");
const { body, param } = require("express-validator");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/projects - Get all projects (role-based access)
router.get("/", getAllProjects);

// GET /api/projects/user - Get all projects for the authenticated user with their tasks
router.get("/user", getAllProjectsForUserWithTasks);

// GET /api/projects/stats - Get project statistics
router.get("/stats", getProjectStats);

// GET /api/projects/:id - Get single project
router.get("/:id",
  [
    param("id").isMongoId().withMessage("Invalid project ID"),
    handleValidationErrors
  ],
  canAccessProject,
  getProjectById
);

// POST /api/projects - Create new project (Moderator and Admin only)
router.post("/", isModerator, createProject);

// PUT /api/projects/:id - Update project
router.put("/:id",
  [
    param("id").isMongoId().withMessage("Invalid project ID"),
    handleValidationErrors
  ],
  canAccessProject,
  validateProjectUpdate,
  updateProject
);

// DELETE /api/projects/:id - Delete project
router.delete("/:id",
  [
    param("id").isMongoId().withMessage("Invalid project ID"),
    handleValidationErrors
  ],
  canAccessProject,
  deleteProject
);

// PUT /api/projects/:id/team-members - Add team member to project
router.put("/:id/team-members",
  [
    param("id").isMongoId().withMessage("Invalid project ID"),
    body("userId").isMongoId().withMessage("Valid user ID is required"),
    body("role")
      .optional()
      .isIn(["lead", "developer", "tester", "designer"])
      .withMessage("Role must be lead, developer, tester, or designer"),
    handleValidationErrors
  ],
  canAccessProject,
  addTeamMember
);

// DELETE /api/projects/:id/team-members/:userId - Remove team member from project
router.delete("/:id/team-members/:userId",
  [
    param("id").isMongoId().withMessage("Invalid project ID"),
    param("userId").isMongoId().withMessage("Invalid user ID"),
    handleValidationErrors
  ],
  canAccessProject,
  removeTeamMember
);

module.exports = router;