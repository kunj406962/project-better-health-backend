/**
 * routes/user.js - User Profile Routes
 * 
 * This file handles user profile management endpoints:
 * - Get user profile information
 * - Update user profile
 * 
 * All routes are protected with JWT authentication (requires valid token).
 */

// Import required packages
const express = require('express');

// Import authentication middleware
const { protect } = require('../middleware/auth');

// Import User model
const User = require('../models/User');

// Create router instance
const router = express.Router();

// ======================
// Get User Profile
// ======================

/**
 * GET /api/user/profile
 * 
 * Retrieve the authenticated user's profile information.
 * 
 * Authentication: Required (JWT token in Authorization header)
 * 
 * Response:
 * {
 *   success: boolean,
 *   user: {
 *     id, name, email, avatar, authMethod, createdAt, updatedAt, ...
 *   }
 * }
 */
router.get('/profile', protect, async (req, res) => {
  // The protect middleware attaches the authenticated user to req.user
  res.json({
    success: true,
    // Return the user object from the request (set by protect middleware)
    user: req.user
  });
});

// ======================
// Update User Profile
// ======================

/**
 * PUT /api/user/profile
 * 
 * Update the authenticated user's profile information.
 * Currently allows updating name and avatar.
 * 
 * Authentication: Required (JWT token in Authorization header)
 * 
 * Request body:
 * {
 *   name: string (optional),
 *   avatar: string (optional, URL to avatar image)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   user: { updated user object }
 * }
 */
router.put('/profile', protect, async (req, res) => {
  try {
    // Extract fields to update from request body
    const { name, avatar } = req.body;
    
    // Find user by ID and update with new values
    // { new: true } returns the updated document
    // { runValidators: true } validates data against schema rules
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, avatar },
      { new: true, runValidators: true }
    );

    // Send success response with updated user
    res.json({
      success: true,
      user
    });
  } catch (error) {
    // Return error response
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Export router for use in app.js
module.exports = router;