// Import the express library
const express = require('express');

// Initialize the Express application
const app = express();

// Define the port number the server will listen on
const PORT = 5000;

// Define a GET route at /api/test
app.get('/api/test', (req, res) => {
  // Send a JSON response with the success message
  res.json({
    message: "Backend is working!"
  });
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  // Log a message to the console indicating the server is running
  console.log(`Server is running on port ${PORT}`);
});
