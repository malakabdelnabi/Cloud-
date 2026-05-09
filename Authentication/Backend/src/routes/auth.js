const express = require('express');
const { 
  register, 
  login, 
  logout, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Community Member, Facility Manager, Worker, Admin)
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/logout
 * @desc    Invalidate session (handled client-side with JWT)
 */
router.post('/logout', logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Update password using reset token
 */
router.post('/reset-password', resetPassword);

module.exports = router;