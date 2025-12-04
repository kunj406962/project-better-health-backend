/**
 * routes/auth.js - Authentication Routes
 * 
 * This file handles all authentication-related endpoints:
 * - Email/password registration and login
 * - Google OAuth authentication
 * - Email existence checking
 */

// Import required packages
const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/tokens');

// Create router instance
const router = express.Router();

// ======================
// Email/Password Registration
// ======================

/**
 * POST /api/auth/register
 * 
 * Register a new user with email and password.
 * 
 * Request body:
 * {
 *   name: string,
 *   email: string,
 *   password: string
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   token: JWT token,
 *   user: { id, name, email }
 * }
 */
router.post('/register', async (req, res) => {
  try {
    // Extract user input from request body
    const { name, email, password } = req.body;

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password using bcrypt with 12 salt rounds
    // Higher rounds = more secure but slower
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user document in database
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      // Set authMethod to email for password-based auth
      authMethod: 'email'
    });

    // Generate JWT token for immediate login
    const token = generateToken(user._id);

    // Send success response with token and user data
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    // Log error for debugging
    console.error('Registration error:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ======================
// Email/Password Login
// ======================

/**
 * POST /api/auth/login
 * 
 * Login user with email and password.
 * 
 * Request body:
 * {
 *   email: string,
 *   password: string
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   token: JWT token,
 *   user: { id, name, email }
 * }
 */
router.post('/login', async (req, res) => {
  try {
    // Extract credentials from request body
    const { email, password } = req.body;

    // Find user by email
    // .select('+password') includes password field (normally excluded)
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare provided password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    // Check if password matches
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token for successful login
    const token = generateToken(user._id);

    // Send success response with token and user data
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    // Log error for debugging
    console.error('Login error:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ======================
// Google OAuth Routes
// ======================

/**
 * GET /api/auth/google
 * 
 * Initiates Google OAuth flow.
 * Redirects user to Google login/consent screen.
 * 
 * Scope: requests access to user's profile and email
 */
router.get('/google', passport.authenticate('google', {
  // Request access to user profile and email
  scope: ['profile', 'email']
}));

/**
 * GET /api/auth/google/callback
 * 
 * OAuth callback URL that Google redirects to after user approves/denies.
 * 
 * Passport validates the auth code and gets user profile.
 * Configuration in config/oauth.js handles user creation/lookup.
 */
router.get('/google/callback', passport.authenticate('google', {
  // Don't use sessions, use tokens instead
  session: false,
  // Redirect to failure endpoint if OAuth fails
  failureRedirect: '/api/auth/google/failure'
}), (req, res) => {
  // Generate JWT token for the authenticated user
  const token = generateToken(req.user._id);
  
  // Send success response with token
  res.json({
    success: true,
    message: 'Google OAuth successful',
    token: token,
    user: req.user
  });
});

/**
 * GET /api/auth/google/failure
 * 
 * OAuth failure handler.
 * Called if user denies permissions or if an error occurs.
 */
router.get('/google/failure', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Google OAuth failed'
  });
});

// ======================
// Utility Routes
// ======================

/**
 * GET /api/auth/check-email/:email
 * 
 * Check if an email is already registered.
 * Useful for real-time validation during registration.
 * 
 * Parameters:
 * - email: email address to check
 * 
 * Response:
 * {
 *   exists: boolean,
 *   user: user object (if exists)
 * }
 */
router.get('/check-email/:email', async (req, res) => {
  try {
    // Search for user with provided email
    const user = await User.findOne({ email: req.params.email });
    
    // Return whether user exists and user data
    res.json({
      exists: !!user,
      user: user
    });
  } catch (error) {
    // Return error response
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

const crypto = require('crypto');

// Forgot Password - Generate reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    
    // Always return success (security best practice)
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists, you will receive a reset email shortly.'
      });
    }

    // Generate unique reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token for storage
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save hashed token and expiry (1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    
    await user.save();

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;

    // For now, just return the URL (you'll add email later)
    res.json({
      success: true,
      message: 'Password reset link generated',
      resetUrl: resetUrl, // In development
      note: 'In production, this URL would be sent via email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process reset request'
    });
  }
});

// Reset Password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by hashed token and check expiry
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    
    // Clear reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Verify reset token (for the web page)
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.redirect('/reset-invalid.html');
    }

    // Token is valid - serve the reset page
    res.redirect(`/reset-password.html?token=${token}`);

  } catch (error) {
    res.redirect('/reset-invalid.html');
  }
});

// Export router for use in app.js
module.exports = router;