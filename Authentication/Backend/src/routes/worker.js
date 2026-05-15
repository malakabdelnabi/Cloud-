const express = require('express');
const router = express.Router();
const multer = require('multer');
const requireAuth = require('../middleware/requireAuth');
const authorize = require('../middleware/roleMiddleware');
const { getMyTickets, getMyTicketById, markInProgress, addComment, uploadCompletionPhoto } = require('../controllers/workerController');

const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);
router.use(authorize('Worker'));

router.get('/tickets', getMyTickets);
router.get('/tickets/:id', getMyTicketById);
router.patch('/tickets/:id/start', markInProgress);
router.post('/tickets/:id/comment', addComment);
router.patch('/tickets/:id/complete', upload.single('photo'), uploadCompletionPhoto);

module.exports = router;