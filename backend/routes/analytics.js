const express = require("express");
const {
  getDashboardAnalytics,
  getProjectCompletionTrend,
  getTeamPerformance
} = require("../controllers/analyticsController");
const { authenticate, isModerator } = require("../middleware/auth");
const { query } = require("express-validator");
const { handleValidationErrors } = require("../utils/validators");

const router = express.Router();

router.use(authenticate);

router.get("/dashboard",getDashboardAnalytics);

router.get("/project-completion",
  [
    query("days")
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage("Days must be between 1 and 365"),
    handleValidationErrors
  ],
  getProjectCompletionTrend
);

router.get("/team-performance",
  [
    query("projectId")
      .optional()
      .isMongoId()
      .withMessage("Invalid project ID"),
    query("timeFrame")
      .optional()
      .isIn(["7d", "30d", "90d", "1y"])
      .withMessage("Time frame must be 7d, 30d, 90d, or 1y"),
    handleValidationErrors
  ],
  isModerator,
  getTeamPerformance
);

module.exports = router;