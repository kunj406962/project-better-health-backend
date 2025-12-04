/**
 * config/database.js - MongoDB Connection Setup
 * 
 * This file provides a function to establish connection to MongoDB database.
 * Currently not directly used (connection happens in app.js), but available for use.
 */

// Import Mongoose ODM
const mongoose = require('mongoose');

// ======================
// Database Connection Function
// ======================

/**
 * connectDB - Establishes MongoDB connection
 * 
 * Connects to MongoDB using connection string from MONGODB_URI environment variable.
 * Logs connection success with hostname or exits process on failure.
 * 
 * Usage: await connectDB();
 */
const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    // Log successful connection with host information
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log connection error
    console.error('Database connection error:', error);
    
    // Exit process with error code if connection fails
    process.exit(1);
  }
};

// Export the connection function for use in other modules
module.exports = connectDB;