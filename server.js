// Import the express library
const express = require('express');
// Import the cors library
const cors = require('cors');

// Initialize the Express application
const app = express();

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Define the port number the server will listen on (use the port provided by the hosting environment, or default to 5000 locally)
const PORT = process.env.PORT || 5000;

// Define a GET route at /api/test
app.get('/api/test', (req, res) => {
  // Send a JSON response with the success message
  res.json({
    message: "Backend is working!"
  });
});

// Define a GET route at the root (/) to guide users
app.get('/', (req, res) => {
  res.json({
    message: "Backend is running! Please visit /api/test to view the API route."
  });
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  // Log a message to the console indicating the server is running
  console.log(`Server is running on port ${PORT}`);
});
