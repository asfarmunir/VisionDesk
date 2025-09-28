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
  validateProjectUpdate,
  handleValidationErrors
} = require("../utils/validators");
const { body, param } = require("express-validator");

const router = express.Router();

router.use(authenticate);

router.get("/", getAllProjects);

router.get("/user", getAllProjectsForUserWithTasks);

router.get("/stats", getProjectStats);

router.get("/:id",
  [
    param("id").isMongoId().withMessage("Invalid project ID"),
    handleValidationErrors
  ],
  canAccessProject,
  getProjectById
);

router.post("/", isModerator, createProject);

router.put("/:id",
  [
    param("id").isMongoId().withMessage("Invalid project ID"),
    handleValidationErrors
  ],
  canAccessProject,
  validateProjectUpdate,
  updateProject
);

router.delete("/:id",
  [
    param("id").isMongoId().withMessage("Invalid project ID"),
    handleValidationErrors
  ],
  canAccessProject,
  deleteProject
);

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



module.exports = router;