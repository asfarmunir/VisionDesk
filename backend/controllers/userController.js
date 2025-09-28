const { User } = require("../models");
const {
  formatSuccessResponse,
  formatErrorResponse,
  getPaginationData,
  getSkipValue
} = require("../utils/helpers");

const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "",
      isActive = ""
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== "") {
      query.isActive = isActive === "true";
    }

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    
    // Get users with pagination
    const users = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(getSkipValue(page, limit))
      .limit(parseInt(limit));

    const pagination = getPaginationData(page, limit, totalUsers);

    res.json(
      formatSuccessResponse({
        users,
        pagination
      }, "Users retrieved successfully")
    );
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to retrieve users", 500)
    );
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-passwordHash");
    
    if (!user) {
      return res.status(404).json(
        formatErrorResponse("User not found", 404)
      );
    }

    res.json(
      formatSuccessResponse(user, "User retrieved successfully")
    );
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to retrieve user", 500)
    );
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json(
        formatErrorResponse("User with this email already exists", 400)
      );
    }

    // Create new user
    const user = new User({
      name,
      email,
      passwordHash: password, // Will be hashed by pre-save hook
      role
    });

    await user.save();

    res.status(201).json(
      formatSuccessResponse(user, "User created successfully", 201)
    );
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to create user", 500)
    );
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(
        formatErrorResponse("User not found", 404)
      );
    }

    // Check permissions
    const isAdmin = req.user.role === "admin";
    const isOwnProfile = req.user._id.toString() === id;

    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json(
        formatErrorResponse("You can only update your own profile", 403)
      );
    }

    // Build updates
    const updates = {};
    
    if (name) updates.name = name;
    
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: id } 
      });
      
      if (existingUser) {
        return res.status(400).json(
          formatErrorResponse("Email is already taken", 400)
        );
      }
      
      updates.email = email;
    }

    // Only admin can update role and isActive
    if (isAdmin) {
      if (role) updates.role = role;
      if (typeof isActive === "boolean") updates.isActive = isActive;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select("-passwordHash");

    res.json(
      formatSuccessResponse(updatedUser, "User updated successfully")
    );
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to update user", 500)
    );
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(
        formatErrorResponse("User not found", 404)
      );
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json(
        formatErrorResponse("You cannot delete your own account", 400)
      );
    }

    // Soft delete - just deactivate the user
    user.isActive = false;
    await user.save();

    res.json(
      formatSuccessResponse(null, "User deleted successfully")
    );
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to delete user", 500)
    );
  }
};

const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [{ $eq: ["$isActive", true] }, 1, 0]
            }
          },
          adminCount: {
            $sum: {
              $cond: [{ $eq: ["$role", "admin"] }, 1, 0]
            }
          },
          moderatorCount: {
            $sum: {
              $cond: [{ $eq: ["$role", "moderator"] }, 1, 0]
            }
          },
          userCount: {
            $sum: {
              $cond: [{ $eq: ["$role", "user"] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      adminCount: 0,
      moderatorCount: 0,
      userCount: 0
    };

    res.json(
      formatSuccessResponse(result, "User statistics retrieved successfully")
    );
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to retrieve user statistics", 500)
    );
  }
};

const assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["admin", "moderator", "user"].includes(role)) {
      return res.status(400).json(
        formatErrorResponse("Invalid role", 400)
      );
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(
        formatErrorResponse("User not found", 404)
      );
    }

    user.role = role;
    await user.save();

    res.json(
      formatSuccessResponse(user, "Role assigned successfully")
    );
  } catch (error) {
    console.error("Assign role error:", error);
    res.status(500).json(
      formatErrorResponse("Failed to assign role", 500)
    );
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  assignRole
};