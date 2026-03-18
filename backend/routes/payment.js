const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

let razorpay;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("✅ Razorpay initialized successfully");
  } else {
    console.warn("⚠️ Razorpay keys missing in .env. Payment features will be simulated.");
  }
} catch (err) {
  console.error("❌ Razorpay initialization error:", err.message);
}

// Map plan IDs to prices in INR (amount in paise, so multiply by 100)
const PLAN_PRICES = {
  pro: 83000, // ₹830
  teacher: 250000, // ₹2500
};

// Create an order
router.post("/create-order", auth, async (req, res) => {
  const { planId } = req.body;

  if (!PLAN_PRICES[planId]) {
    return res.status(400).json({ message: "Invalid plan ID" });
  }

  const options = {
    amount: PLAN_PRICES[planId],
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("Razorpay error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verify payment
router.post("/verify-payment", auth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

  const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest("hex");

  if (digest === razorpay_signature) {
    // Payment verified
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user subscription
      user.subscription = {
        plan: planId,
        status: "active",
        startDate: new Date(),
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      };

      // Also update role if it's a teacher plan
      if (planId === "teacher") {
        user.role = "teacher";
      } else if (planId === "pro") {
        user.role = "student"; // Pro students are still students but with pro plan
      }

      await user.save();

      res.json({ message: "Payment verified and subscription updated successfully" });
    } catch (err) {
      console.error("Update user error:", err);
      res.status(500).json({ error: "Failed to update subscription" });
    }
  } else {
    res.status(400).json({ message: "Invalid signature" });
  }
});

module.exports = router;
