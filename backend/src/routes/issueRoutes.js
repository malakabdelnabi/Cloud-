const express = require('express');
const router = express.Router();
const multer = require('multer');
const { submitIssue, getMyIssues, getIssueById } = require('../controllers/issueController');
const requireAuth = require('../middleware/authMiddleware');

// Store file in memory buffer before uploading to Supabase
const upload = multer({ storage: multer.memoryStorage() });

// Routes
router.post('/', requireAuth, upload.single('photo'), submitIssue);      // US-CM-03, US-CM-04
router.get('/', requireAuth, getMyIssues);                                // US-CM-05
router.get('/:id', requireAuth, getIssueById);                           // US-CM-07

module.exports = router;