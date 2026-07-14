require('dotenv').config();
const crypto = require('crypto');

async function testPaymentVerification() {
  const amount = 500; // 500 INR
  
  console.log("Step 1: Creating order on backend...");
  const createRes = await fetch('http://localhost:5000/api/payment/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  });
  
  if (!createRes.ok) {
    console.error("Failed to create order:", await createRes.text());
    process.exit(1);
  }
  
  const orderData = await createRes.json();
  console.log("Order created successfully:", orderData);
  
  const razorpay_order_id = orderData.order_id;
  const razorpay_payment_id = 'pay_test_' + Math.random().toString(36).substring(2, 15);
  
  console.log("Step 2: Simulating test payment completion...");
  console.log(`Simulated Payment ID: ${razorpay_payment_id}`);
  
  console.log("Step 3: Verifying the Razorpay payment signature...");
  // Generate valid signature using secret
  const razorpay_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest('hex');
    
  console.log(`Generated Signature: ${razorpay_signature}`);
  
  console.log("Sending verification request to backend...");
  const verifyRes = await fetch('http://localhost:5000/api/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    })
  });
  
  const verifyResult = await verifyRes.json();
  console.log("Backend response:", verifyResult);
  
  if (verifyResult.success && verifyResult.message === "Payment verified successfully") {
    console.log("✅ CHECK PASSED: Payment verified successfully");
  } else {
    console.error("❌ CHECK FAILED: Verification response was not successful");
    process.exit(1);
  }
}

testPaymentVerification().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
