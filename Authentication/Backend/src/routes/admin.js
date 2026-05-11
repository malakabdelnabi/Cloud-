const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const authorize = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

router.use(requireAuth);
router.use(authorize('Admin'));

router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', adminController.updateUserStatus);

module.exports = router;
