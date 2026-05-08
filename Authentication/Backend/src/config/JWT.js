const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || "2bb7ccb7-3347-47cc-8550-76f4d40c4ca9";
const EXPIRES_IN = '7d';

/**
 * Generates a JWT token for a given payload.
 * @param {Object} payload - The data to include in the token (e.g., userId).
 * @returns {string} The generated JWT.
 */
exports.generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: EXPIRES_IN,
  });
};

/**
 * Verifies a JWT token.
 * @param {string} token - The token to verify.
 * @returns {Object} The decoded payload.
 * @throws {Error} If the token is invalid or expired.
 */
exports.verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Hashes a plain text password using bcrypt.
 * @param {string} password - The plain text password.
 * @returns {Promise<string>} The hashed password.
 */
exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compares a plain text password with a hashed password.
 * @param {string} password - The plain text password.
 * @param {string} hashedPassword - The hashed password.
 * @returns {Promise<boolean>} True if they match, false otherwise.
 */
exports.comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};