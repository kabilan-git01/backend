const Razorpay = require('razorpay');

// Ensure environment variables are loaded
require('dotenv').config();

/**
 * Configure and initialize Razorpay client instance.
 * Accesses key_id and key_secret from the environment variables.
 */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;
