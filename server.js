/**
 * server.js - Server Entry Point
 * 
 * This file is the main entry point for the application.
 * It imports the configured Express app and starts the HTTP server.
 */

// Import the configured Express application
const app = require('./app');

// ======================
// Server Configuration
// ======================

// Get port from environment variables or use default port 5000
const PORT = process.env.PORT || 5000;

// ======================
// Start Server
// ======================

// Start listening on the specified port
// The app is now ready to accept incoming HTTP requests
// In your server.js or app.js

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});