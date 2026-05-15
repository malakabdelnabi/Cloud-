    const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const authorize = require('../middleware/roleMiddleware');
const {
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  closeTicket,
  addInternalNote,
  deleteTicket,
  getWorkers,
  setWorkerStatus,
} = require('../controllers/managerController');

const router = express.Router();

// All manager routes require authentication + Facility Manager (or Admin) role
router.use(requireAuth);
router.use(authorize('Facility Manager', 'Admin'));

// ── Ticket routes ──────────────────────────────
router.get('/tickets',              getAllTickets);        // GET  /api/manager/tickets?status=&category=&priority=&assigned_to=
router.get('/tickets/:id',          getTicketById);        // GET  /api/manager/tickets/:id  (full details incl. reporter, worker, comments)
router.patch('/tickets/:id/status', updateTicketStatus);   // PATCH /api/manager/tickets/:id/status   { status, internal_notes? }
router.patch('/tickets/:id/priority', updateTicketPriority); // PATCH /api/manager/tickets/:id/priority { priority }
router.patch('/tickets/:id/assign', assignTicket);         // PATCH /api/manager/tickets/:id/assign   { worker_id }
router.patch('/tickets/:id/close',  closeTicket);          // PATCH /api/manager/tickets/:id/close    { internal_notes? }
router.patch('/tickets/:id/notes',  addInternalNote);      // PATCH /api/manager/tickets/:id/notes    { internal_notes }
router.delete('/tickets/:id',       deleteTicket);         // DELETE /api/manager/tickets/:id        — removes ticket + storage images

// ── Worker management ─────────────────────────
router.get('/workers',              getWorkers);          // GET   /api/manager/workers
router.patch('/workers/:id/status', setWorkerStatus);     // PATCH /api/manager/workers/:id/status  { is_active }

module.exports = router;

    
