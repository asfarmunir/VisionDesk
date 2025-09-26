const { User } = require("../models");
const { 
  generateToken, 
  generateRefreshToken, 
  verifyToken, 
  formatSuccessResponse, 
  formatErrorResponse 
} = require("../utils/helpers");

// Store refresh tokens (In production, use Redis or database)
const refreshTokens = new Set();

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json(
        formatErrorResponse("User with this email already exists.", 400)
      );
    }

    // Create new user
    const user = new User({
      name,
      email,
      passwordHash: password, // Will be hashed by pre-save middleware
      role: role || "user"
    });

    await user.save();

    // Generate tokens
    const tokenPayload = { id: user._id, email: user.email, role: user.role };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    refreshTokens.add(refreshToken);

    // Remove sensitive data from response
    const userResponse = user.toJSON();

    res.status(201).json(
      formatSuccessResponse({
        user: userResponse,
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE
      }, "User registered successfully", 201)
    );
  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json(
        formatErrorResponse("Validation failed", 400, errors)
      );
    }

    res.status(500).json(
      formatErrorResponse("Server error during registration", 500)
    );
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json(
        formatErrorResponse("Invalid email or password.", 401)
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json(
        formatErrorResponse("Account is deactivated. Please contact administrator.", 401)
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json(
        formatErrorResponse("Invalid email or password.", 401)
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokenPayload = { id: user._id, email: user.email, role: user.role };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    refreshTokens.add(refreshToken);

    // Remove sensitive data from response
    const userResponse = user.toJSON();

    res.json(
      formatSuccessResponse({
        user: userResponse,
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE
      }, "Login successful")
    );
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json(
      formatErrorResponse("Server error during login", 500)
    );
  }
};

// Refresh access token
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json(
        formatErrorResponse("Refresh token is required.", 401)
      );
    }

    // Check if refresh token exists in our store
    if (!refreshTokens.has(refreshToken)) {
      return res.status(403).json(
        formatErrorResponse("Invalid refresh token.", 403)
      );
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      // Remove invalid refresh token
      refreshTokens.delete(refreshToken);
      return res.status(403).json(
        formatErrorResponse("User not found or inactive.", 403)
      );
    }

    // Generate new access token
    const tokenPayload = { id: user._id, email: user.email, role: user.role };
    const newAccessToken = generateToken(tokenPayload);

    res.json(
      formatSuccessResponse({
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_EXPIRE
      }, "Token refreshed successfully")
    );
  } catch (error) {
    console.error("Token refresh error:", error);
    
    if (error.message.includes("Invalid or expired token")) {
      return res.status(403).json(
        formatErrorResponse("Invalid or expired refresh token.", 403)
      );
    }

    res.status(500).json(
      formatErrorResponse("Server error during token refresh", 500)
    );
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove refresh token from store
      refreshTokens.delete(refreshToken);
    }

    res.json(
      formatSuccessResponse(null, "Logged out successfully")
    );
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json(
      formatErrorResponse("Server error during logout", 500)
    );
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    // User is already available from auth middleware
    res.json(
      formatSuccessResponse(req.user, "Profile retrieved successfully")
    );
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json(
      formatErrorResponse("Server error retrieving profile", 500)
    );
  }
};

// Update current user profile
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user._id;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser._id.toString() !== userId.toString()) {
        return res.status(400).json(
          formatErrorResponse("Email is already in use by another account.", 400)
        );
      }
    }

    // Update user
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(
      formatSuccessResponse(updatedUser, "Profile updated successfully")
    );
  } catch (error) {
    console.error("Update profile error:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json(
        formatErrorResponse("Validation failed", 400, errors)
      );
    }

    res.status(500).json(
      formatErrorResponse("Server error updating profile", 500)
    );
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        formatErrorResponse("User not found.", 404)
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json(
        formatErrorResponse("Current password is incorrect.", 400)
      );
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    res.json(
      formatSuccessResponse(null, "Password changed successfully")
    );
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json(
      formatErrorResponse("Server error changing password", 500)
    );
  }
};

// Verify token endpoint (useful for frontend to check token validity)
const verifyAuthToken = async (req, res) => {
  try {
    // If we reach here, token is valid (auth middleware passed)
    res.json(
      formatSuccessResponse({
        valid: true,
        user: req.user
      }, "Token is valid")
    );
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json(
      formatErrorResponse("Server error during token verification", 500)
    );
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  verifyAuthToken
};