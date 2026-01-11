// backend/index.js
const express = require('express');
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const rootRouter = require("./routes/index");

const app = express();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { message: "Too many login attempts, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
});

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 signup attempts per hour
    message: { message: "Too many signup attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});

// Transfer rate limiter
const transferLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 transfers per hour
    message: { message: "Transfer limit reached, try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});

// Withdrawal/Payout rate limiter (stricter)
const payoutLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // 5 withdrawals per day
    message: { message: "Daily withdrawal limit reached" },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Apply rate limiting to routes
app.use("/api/v1/user/signin", authLimiter);
app.use("/api/v1/user/signup", signupLimiter);
app.use("/api/v1/account/transfer", transferLimiter);
app.use("/api/v1/razorpay/payout", payoutLimiter);

app.use("/api/v1", rootRouter);

app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
    console.log("🔒 Rate limiting enabled for auth, transfer, and payout routes");
});