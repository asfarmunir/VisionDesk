const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Project title is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Project description is required"],
    trim: true,
    minlength: [10, "Project description must be at least 10 characters long"],
    maxlength: [1000, "Project description cannot exceed 1000 characters"]
  },
  status: {
    type: String,
    enum: {
      values: ["active", "completed", "cancelled"],
      message: "Status must be active, completed, or cancelled"
    },
    default: "active"
  },
  priority: {
    type: String,
    enum: {
      values: ["low", "medium", "high", "urgent"],
      message: "Priority must be low, medium, high, or urgent"
    },
    default: "medium"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Project creator is required"]
  },
  teamMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["lead", "developer", "tester", "designer"],
      default: "developer"
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  completedDate: {
    type: Date
  },
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
projectSchema.index({ status: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ "teamMembers.user": 1 });
projectSchema.index({ priority: 1 });

// Virtual for tasks count
projectSchema.virtual("taskCount", {
  ref: "Task",
  localField: "_id",
  foreignField: "projectId",
  count: true
});

// Virtual for completed tasks count
projectSchema.virtual("completedTaskCount", {
  ref: "Task",
  localField: "_id",
  foreignField: "projectId",
  match: { status: "resolved" },
  count: true
});

// Update progress when status changes to completed
projectSchema.pre("save", function(next) {
  if (this.isModified("status") && this.status === "completed") {
    this.completedDate = new Date();
    this.progress = 100;
  }
  next();
});

// Static method to get projects by user role
projectSchema.statics.getProjectsByUserRole = function(userId, userRole) {
  if (userRole === "admin") {
    return this.find().populate("createdBy teamMembers.user", "name email role");
  } else if (userRole === "moderator") {
    return this.find({ createdBy: userId }).populate("createdBy teamMembers.user", "name email role");
  } else {
    return this.find({ "teamMembers.user": userId }).populate("createdBy teamMembers.user", "name email role");
  }
};

module.exports = mongoose.model("Project", projectSchema);