/**
 * middleware/auth.js - JWT Authentication Middleware
 * 
 * This middleware protects routes by verifying JWT tokens.
 * It checks for valid tokens in the Authorization header and fetches the user.
 */

// Import required packages
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ======================
// Authentication Middleware
// ======================

/**
 * protect - Route protection middleware using JWT
 * 
 * This middleware:
 * 1. Extracts JWT token from Authorization header
 * 2. Verifies the token is valid
 * 3. Retrieves the authenticated user from database
 * 4. Attaches user to req.user for use in route handlers
 * 
 * Usage: app.get('/route', protect, handler)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // ======================
    // Extract JWT Token
    // ======================

    // Check if Authorization header exists and starts with "Bearer "
    // Expected format: "Authorization: Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract token by splitting "Bearer <token>" and taking the second part
      token = req.headers.authorization.split(' ')[1];
    }

    // ======================
    // Validate Token Presence
    // ======================

    // If no token found, deny access
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // ======================
    // Verify & Decode Token
    // ======================

    // Verify the token signature and expiration
    // The token contains the user ID in decoded.id
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ======================
    // Fetch User from Database
    // ======================

    // Retrieve the user document using the ID from the token
    const user = await User.findById(decoded.id);

    // Verify user still exists in database
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // ======================
    // Attach User & Continue
    // ======================

    // Attach user object to request for use in route handlers
    req.user = user;
    
    // Call next middleware/route handler
    next();
  } catch (error) {
    // Handle any errors (invalid token, expired token, etc.)
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Export the protect middleware
module.exports = { protect };