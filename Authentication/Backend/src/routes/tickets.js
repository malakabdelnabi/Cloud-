const express = require('express');
const multer = require('multer');
const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  assignTicket,
  deleteTicket
} = require('../controllers/ticketController');
const requireAuth = require('../middleware/requireAuth');
const authorize = require('../middleware/roleMiddleware');

const router = express.Router();

// multer keeps the uploaded file in memory as a Buffer. 10 MB cap.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// All ticket routes require authentication
router.use(requireAuth);

router.get('/', getTickets);
router.get('/:id', getTicketById);

// Only Community Members can create tickets
router.post('/', authorize('Community Member'), upload.single('image'), createTicket);

// Workers and Managers can update status
router.patch('/:id/status', authorize('Worker', 'Facility Manager', 'Admin'), upload.single('image'), updateTicketStatus);

// Only Managers and Admins can assign tickets
router.patch('/:id/assign', authorize('Facility Manager', 'Admin'), assignTicket);

// Only Admins can delete tickets (or reporters - logic in controller)
router.delete('/:id', authorize('Admin'), deleteTicket);

module.exports = router;
