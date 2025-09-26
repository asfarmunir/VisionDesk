const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  refreshAccessToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  verifyAuthToken
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const {
  validateUserRegistration,
  validateUserLogin,
  handleValidationErrors
} = require("../utils/validators");

const router = express.Router();

// Public routes
router.post("/register", validateUserRegistration, register);
router.post("/login", validateUserLogin, login);
router.post("/refresh", 
  [
    body("refreshToken")
      .notEmpty()
      .withMessage("Refresh token is required"),
    handleValidationErrors
  ],
  refreshAccessToken
);

// Protected routes (require authentication)
router.use(authenticate); // All routes below this will require authentication

router.post("/logout", logout);
router.get("/profile", getProfile);
router.put("/profile", 
  [
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
    handleValidationErrors
  ],
  updateProfile
);

router.put("/change-password",
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
    handleValidationErrors
  ],
  changePassword
);

router.get("/verify", verifyAuthToken);

module.exports = router;