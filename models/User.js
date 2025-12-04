/**
 * models/User.js - User Database Schema
 * 
 * This file defines the Mongoose schema for User documents in MongoDB.
 * Includes schema definition, validation rules, and custom methods.
 */

// Import required packages
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ======================
// User Schema Definition
// ======================

/**
 * User Schema
 * 
 * Defines the structure and validation rules for user documents.
 * Supports both email/password and OAuth authentication methods.
 */
const UserSchema = new mongoose.Schema({
  
  // User's full name
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 50
  },

  // User's email address
  // Must be unique and stored in lowercase for consistency
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },

  // User's password hash (only stored for email/password auth)
  // Required only if user doesn't have OAuth providers
  // Not selected by default (select: false) for security
  password: {
    type: String,
    required: function() {
      // Password is required only if user has no OAuth providers
      return !this.oauthProviders || this.oauthProviders.length === 0;
    },
    minlength: 6,
    select: false // Exclude from queries by default for security
  },

  // User's profile avatar URL
  avatar: {
    type: String,
    default: null
  },

  // Authentication method used to create account
  authMethod: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },

  // Array of OAuth providers linked to this account
  // Allows users to have multiple auth methods
  oauthProviders: [{
    // OAuth provider name (currently supports Google)
    provider: {
      type: String,
      enum: ['google']
    },
    // Unique identifier from OAuth provider
    providerId: String,
    // Access token for API calls (if needed)
    accessToken: String,
    // Refresh token for token renewal
    refreshToken: String
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}
, {
  // Enable automatic createdAt and updatedAt timestamps
  timestamps: true
});

// ======================
// Schema Methods
// ======================

/**
 * comparePassword - Instance method to compare plaintext password with hash
 * 
 * @param {string} candidatePassword - The plaintext password to compare
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 * 
 * Used during login to verify password without exposing the hash
 */
UserSchema.methods.comparePassword = async function(candidatePassword) {
  // Return false if user has no password (OAuth-only user)
  if (!this.password) return false;
  // Use bcrypt to compare plaintext with stored hash
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * isOAuthOnly - Instance method to check if user uses only OAuth authentication
 * 
 * @returns {boolean} - True if user has OAuth providers but no password
 * 
 * Helps determine if user can change password or is OAuth-only
 */
UserSchema.methods.isOAuthOnly = function() {
  return this.oauthProviders && this.oauthProviders.length > 0 && !this.password;
};

// ======================
// Model Export
// ======================

/**
 * Export the User model
 * 
 * Checks if model already exists to prevent OverwriteModelError
 * This is important during development with hot-reload tools
 */
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);