const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';

// Hash a password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password with hash
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Generate JWT token for a user
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Validate JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Find user by email (stub; integrate with your DB)
async function findUserByEmail(email) {
  // Placeholder: replace with actual DB call
  // Example: return await db.getUserByEmail(email);
  return null;
}

// Create a new user (stub; integrate with your DB)
async function createUser(userData) {
  // Placeholder: replace with actual DB call
  // Example: return await db.addUser(userData);
  return null;
}

// Attach provider token (stub)
async function attachProviderToken(userId, provider, token) {
  // Placeholder: replace with actual DB call
  // Example: return await db.attachProviderToken(userId, provider, token);
  return null;
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  findUserByEmail,
  createUser,
  attachProviderToken,
};