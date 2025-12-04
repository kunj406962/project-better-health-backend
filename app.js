/**
 * app.js - Express Application Setup
 * 
 * This file initializes and configures the Express application with:
 * - CORS for cross-origin requests
 * - JSON body parsing
 * - Passport authentication middleware
 * - MongoDB connection
 * - Route mounting
 */

// Import required packages
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');

// Load environment variables from .env file
require('dotenv').config();

// Load OAuth configuration (Passport strategies)
require('./config/oauth');

// Create Express application instance
const app = express();

// ======================
// Middleware Setup
// ======================

// Enable CORS - allows requests from different domains
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Initialize Passport authentication middleware
app.use(passport.initialize());

app.use(express.static('public'));

// ======================
// Database Connection
// ======================

// Connect to MongoDB database using Mongoose
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// ======================
// Route Mounting
// ======================

// Mount authentication routes at /api/auth
// This handles register, login, OAuth flows, etc.
app.use('/api/auth', require('./routes/auth'));

// Mount heart rate monitoring routes at /api/water
// This handles water intake data CRUD operations for authenticated users
app.use('/api/water', require('./routes/water'));



// ======================
// Health Check Endpoint
// ======================

// Simple health check endpoint to verify server is running
// Usage: GET /health
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running'
  });
});

// Export the configured app for use in server.js
module.exports = app;