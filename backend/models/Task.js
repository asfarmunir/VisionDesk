const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Task title is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Task description is required"],
    trim: true,
    minlength: [5, "Task description must be at least 5 characters long"],
    maxlength: [500, "Task description cannot exceed 500 characters"]
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: [true, "Project ID is required"]
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Task must be assigned to a user"]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Task creator is required"]
  },
  status: {
    type: String,
    enum: {
      values: ["open", "in-progress", "closed", "approved", "cancelled"],
      message: "Status must be open, in-progress, closed, approved, or cancelled"
    },
    default: "open"
  },
  priority: {
    type: String,
    enum: {
      values: ["low", "medium", "high", "urgent"],
      message: "Priority must be low, medium, high, or urgent"
    },
    default: "medium"
  },
  category: {
    type: String,
    enum: ["bug", "feature", "enhancement", "maintenance", "documentation"],
    default: "feature"
  },
  dueDate: {
    type: Date,
    required: [true, "Due date is required"]
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  completedDate: {
    type: Date
  },
  ticket: {
    type: String,
    trim: true,
    default: ""
  },
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
taskSchema.index({ projectId: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdBy: 1 });

// Compound index for common queries
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });

// Virtual to check if task is overdue
taskSchema.virtual("isOverdue").get(function() {
  if (this.status === "resolved" || this.status === "closed") {
    return false;
  }
  return new Date() > this.dueDate;
});

// Virtual to get days remaining
taskSchema.virtual("daysRemaining").get(function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Update completedDate when status changes to resolved/closed
taskSchema.pre("save", function(next) {
  if (this.isModified("status") && (this.status === "resolved" || this.status === "closed")) {
    this.completedDate = new Date();
  }
  next();
});

// Static method to get tasks by user role
taskSchema.statics.getTasksByUserRole = function(userId, userRole, filters = {}) {
  let query = {};
  
  if (userRole === "user") {
    query.assignedTo = userId;
  } else if (userRole === "moderator") {
    // Moderators can see tasks from their projects
    // This would need to be combined with a project query
    query.createdBy = userId;
  }
  // Admin can see all tasks (no additional filter)
  
  return this.find({ ...query, ...filters })
    .populate("projectId", "title status")
    .populate("assignedTo createdBy", "name email role")
    .sort({ priority: -1, dueDate: 1 });
};

module.exports = mongoose.model("Task", taskSchema);