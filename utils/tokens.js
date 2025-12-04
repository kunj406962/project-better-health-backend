/**
 * utils/tokens.js - JWT Token Generation
 * 
 * This file provides utility functions for creating JWT tokens.
 * Tokens are used for stateless authentication across the application.
 */

// Import JWT library
const jwt = require('jsonwebtoken');

// ======================
// Token Generation Function
// ======================

/**
 * generateToken - Create a signed JWT token
 * 
 * Creates a JWT token containing the user ID and signs it with the secret key.
 * The token expires after the duration specified in JWT_EXPIRE env variable.
 * 
 * Usage: const token = generateToken(user._id);
 * 
 * @param {string} userId - MongoDB user ID to encode in token
 * @returns {string} - Signed JWT token
 * 
 * Token Structure (JWT):
 * - Header: Contains algorithm (HS256)
 * - Payload: Contains { id: userId }
 * - Signature: Created using JWT_SECRET for verification
 * 
 * Example Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
const generateToken = (userId) => {
  return jwt.sign(
    // Payload - data to encode in token
    { id: userId },
    // Secret key for signing (from environment variables)
    process.env.JWT_SECRET,
    // Options
    {
      // Token expiration time (e.g., "7d", "24h")
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

// Export the token generation function
module.exports = { generateToken };