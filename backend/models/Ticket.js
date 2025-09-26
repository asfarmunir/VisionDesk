const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: [true, "Task ID is required"]
  },
  title: {
    type: String,
    required: [true, "Ticket title is required"],
    trim: true,
    maxlength: [100, "Ticket title cannot exceed 100 characters"]
  },
  description: {
    type: String,
    required: [true, "Ticket description is required"],
    trim: true,
    maxlength: [1000, "Ticket description cannot exceed 1000 characters"]
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Resolver ID is required"]
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "verified", "rejected", "closed"],
      message: "Status must be pending, verified, rejected, or closed"
    },
    default: "pending"
  },
  resolution: {
    type: String,
    enum: ["fixed", "duplicate", "wont-fix", "cannot-reproduce", "works-as-designed"],
    required: function() {
      return this.status !== "pending";
    }
  },
  notes: {
    type: String,
    required: [true, "Resolution notes are required"],
    trim: true,
    minlength: [10, "Notes must be at least 10 characters long"],
    maxlength: [2000, "Notes cannot exceed 2000 characters"]
  },
  verificationNotes: {
    type: String,
    trim: true,
    maxlength: [1000, "Verification notes cannot exceed 1000 characters"]
  },
  timeSpent: {
    type: Number,
    min: [0, "Time spent cannot be negative"],
    required: [true, "Time spent is required"]
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ticketSchema.index({ taskId: 1 });
ticketSchema.index({ resolvedBy: 1 });
ticketSchema.index({ verifiedBy: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ resolvedAt: 1 });

// Compound indexes for common queries
ticketSchema.index({ status: 1, resolvedAt: -1 });
ticketSchema.index({ resolvedBy: 1, status: 1 });

// Virtual to check if ticket needs verification
ticketSchema.virtual("needsVerification").get(function() {
  return this.status === "pending" && this.resolution !== undefined;
});

// Virtual to calculate resolution time (in hours)
ticketSchema.virtual("resolutionTime").get(function() {
  if (!this.createdAt || !this.resolvedAt) return null;
  const diffMs = this.resolvedAt - this.createdAt;
  return Math.round(diffMs / (1000 * 60 * 60) * 100) / 100; // Round to 2 decimal places
});

// Pre-save middleware to update timestamps
ticketSchema.pre("save", function(next) {
  if (this.isModified("status")) {
    switch (this.status) {
      case "verified":
        if (!this.verifiedAt) {
          this.verifiedAt = new Date();
        }
        break;
      case "closed":
        if (!this.closedAt) {
          this.closedAt = new Date();
        }
        break;
    }
  }
  next();
});

// Static method to get tickets by user role
ticketSchema.statics.getTicketsByUserRole = function(userId, userRole, filters = {}) {
  let query = {};
  
  if (userRole === "user") {
    query.resolvedBy = userId;
  }
  // Moderators and admins can see all tickets (no additional filter for now)
  
  return this.find({ ...query, ...filters })
    .populate("taskId", "title description projectId")
    .populate("resolvedBy verifiedBy", "name email role")
    .sort({ resolvedAt: -1 });
};

// Static method to get analytics data
ticketSchema.statics.getAnalytics = function(filters = {}) {
  return this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: {
          status: "$status",
          resolution: "$resolution"
        },
        count: { $sum: 1 },
        avgTimeSpent: { $avg: "$timeSpent" },
        totalTimeSpent: { $sum: "$timeSpent" }
      }
    },
    {
      $group: {
        _id: "$_id.status",
        resolutions: {
          $push: {
            type: "$_id.resolution",
            count: "$count",
            avgTimeSpent: "$avgTimeSpent",
            totalTimeSpent: "$totalTimeSpent"
          }
        },
        totalCount: { $sum: "$count" }
      }
    }
  ]);
};

module.exports = mongoose.model("Ticket", ticketSchema);