const express = require("express");
const {
  getAllTickets,
  getTicketById,
  createTicket,
  verifyTicket,
  updateTicket,
  deleteTicket,
  closeTicket,
  getTicketStats
} = require("../controllers/ticketController");
const { authenticate, isModerator } = require("../middleware/auth");
const {
  validateTicketCreation,
  validateTicketVerification,
  handleValidationErrors
} = require("../utils/validators");
const { body, param } = require("express-validator");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/tickets - Get all tickets (role-based access)
router.get("/", getAllTickets);

// GET /api/tickets/stats - Get ticket statistics
router.get("/stats", getTicketStats);

// GET /api/tickets/:id - Get single ticket
router.get("/:id",
  [
    param("id").isMongoId().withMessage("Invalid ticket ID"),
    handleValidationErrors
  ],
  getTicketById
);

// POST /api/tickets - Create new ticket (resolve task)
router.post("/", validateTicketCreation, createTicket);

// PUT /api/tickets/:id/verify - Verify ticket (Moderator and Admin only)
router.put("/:id/verify",
  [
    param("id").isMongoId().withMessage("Invalid ticket ID"),
    handleValidationErrors
  ],
  isModerator,
  validateTicketVerification,
  verifyTicket
);

// PUT /api/tickets/:id - Update ticket
router.put("/:id",
  [
    param("id").isMongoId().withMessage("Invalid ticket ID"),
    body("title")
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage("Title must be between 3 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 5, max: 1000 })
      .withMessage("Description must be between 5 and 1000 characters"),
    body("notes")
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Notes must be between 10 and 2000 characters"),
    body("timeSpent")
      .optional()
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage("Time spent must be a positive number"),
    body("resolution")
      .optional()
      .isIn(["fixed", "duplicate", "wont-fix", "cannot-reproduce", "works-as-designed"])
      .withMessage("Invalid resolution type"),
    handleValidationErrors
  ],
  updateTicket
);

// DELETE /api/tickets/:id - Delete ticket
router.delete("/:id",
  [
    param("id").isMongoId().withMessage("Invalid ticket ID"),
    handleValidationErrors
  ],
  deleteTicket
);

// PUT /api/tickets/:id/close - Close ticket (Final action by moderator/admin)
router.put("/:id/close",
  [
    param("id").isMongoId().withMessage("Invalid ticket ID"),
    body("closureNotes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Closure notes cannot exceed 1000 characters"),
    handleValidationErrors
  ],
  isModerator,
  closeTicket
);

module.exports = router;