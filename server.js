// Load environment variables
require('dotenv').config();

// Import the express library
const express = require('express');
// Import the cors library
const cors = require('cors');
// Import the razorpay client instance
const razorpay = require('./config/razorpay');
// Import crypto library for verification signatures
const crypto = require('crypto');

// Initialize the Express application
const app = express();

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());
// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

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

// Define a POST route to create a Razorpay order
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    // Convert amount to paise (1 INR = 100 paise)
    const amountInPaise = Math.round(parseFloat(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ success: false, message: "Failed to create payment order", error: error.message });
  }
});

// Define a POST route to verify Razorpay signatures
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing required verification fields" });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Fetch order details from Razorpay to get the verified amount (in paise)
      let amount;
      try {
        const order = await razorpay.orders.fetch(razorpay_order_id);
        amount = order.amount;
      } catch (orderError) {
        console.error("Error fetching order from Razorpay:", orderError);
        return res.status(500).json({ 
          success: false, 
          message: "Payment verified, but failed to retrieve order details from Razorpay", 
          error: orderError.message 
        });
      }

      // Save verified payment to Supabase
      try {
        const supabaseResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            amount: amount,
            status: 'success'
          })
        });

        if (!supabaseResponse.ok) {
          const errorText = await supabaseResponse.text();
          console.error("Failed to save payment to Supabase:", errorText);
          return res.status(500).json({
            success: false,
            message: "Payment signature verified, but failed to save record to Supabase database",
            error: errorText
          });
        }
      } catch (dbError) {
        console.error("Database connection error:", dbError);
        return res.status(500).json({
          success: false,
          message: "Payment signature verified, but failed to connect to Supabase database",
          error: dbError.message
        });
      }

      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid payment signature verification failed" });
    }
  } catch (error) {
    console.error("Error verifying signature:", error);
    res.status(500).json({ success: false, message: "Server error during payment verification", error: error.message });
  }
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  // Log a message to the console indicating the server is running
  console.log(`Server is running on port ${PORT}`);
});
