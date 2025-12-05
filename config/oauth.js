/**
 * config/oauth.js - Passport OAuth Configuration
 * 
 * This file configures Google OAuth 2.0 authentication using Passport.
 * Sets up the strategy, serialization, and user creation/lookup logic.
 */

// Import required packages
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// ======================
// Google OAuth Strategy
// ======================

/**
 * Google OAuth Strategy Configuration
 * 
 * Handles the OAuth flow when user tries to login with Google.
 * Verifies credentials and either finds existing user or creates new one.
 */
passport.use(new GoogleStrategy({
  // Google OAuth credentials from environment variables
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  // URL where Google will redirect after user approves/denies
  callbackURL: "https://cataclinal-chantell-subreputably.ngrok-free.dev/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Import User model
    const User = require('../models/User');
    
    // Extract user's email from Google profile
    const userEmail = profile.emails[0].value;
    
    // Check if user already exists in database
    let user = await User.findOne({ email: userEmail });

    // If user exists, return them
    if (user) {
      return done(null, user);
    }

    // Create new user with data from Google profile
    user = await User.create({
      name: profile.displayName,
      email: userEmail,
      // Set authMethod to google for OAuth users
      authMethod: 'google',
      // Create unique dummy password for security (won't be used for login)
      password: 'google-oauth-' + Date.now(),
      // Store OAuth provider information
      oauthProviders: [{
        provider: 'google',
        providerId: profile.id,
        accessToken: accessToken,
        refreshToken: refreshToken
      }]
    });

    // Return the newly created user
    done(null, user);
  } catch (error) {
    // Return error if anything fails
    done(error, null);
  }
}));

// ======================
// Session Serialization
// ======================

/**
 * serializeUser - Determines what user data to store in session
 * 
 * This function is called during login to decide what gets stored in req.session.passport.
 * We store only the user's ID to keep session data small.
 */
passport.serializeUser((user, done) => {
  // Store only the user's MongoDB ID in the session
  done(null, user.id);
});

// ======================
// Session Deserialization
// ======================

/**
 * deserializeUser - Retrieves full user data from stored session
 * 
 * When a user makes a request with an active session, this function
 * retrieves their full user document from the database using the stored ID.
 */
passport.deserializeUser(async (id, done) => {
  try {
    // Import User model
    const User = require('../models/User');
    
    // Fetch full user document by ID
    const user = await User.findById(id);
    
    // Return the user
    done(null, user);
  } catch (error) {
    // Return error if user not found or database error
    done(error, null);
  }
});