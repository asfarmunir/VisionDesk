const { User } = require("../models");
const { 
  generateToken, 
  generateRefreshToken, 
  verifyToken, 
  formatSuccessResponse, 
  formatErrorResponse 
} = require("../utils/helpers");

const refreshTokens = new Set();

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

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
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


const verifyAuthToken = async (req, res) => {
  try {
    // If we reach here, token is valid (auth middleware passed)
    console.log("🚀 ~ verifyAuthToken ~ req.user:", req.user)
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
  verifyAuthToken
};