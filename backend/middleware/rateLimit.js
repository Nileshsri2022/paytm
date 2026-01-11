// Rate limiting middleware for API security
const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: { message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 attempts per hour
    message: { message: 'Too many authentication attempts, try again later' }
});

// Transfer rate limiter
const transferLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 transfers per hour
    message: { message: 'Transfer limit reached, try again later' }
});

// Withdrawal rate limiter (stricter)
const withdrawalLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // 5 withdrawals per day
    message: { message: 'Daily withdrawal limit reached' }
});

module.exports = {
    apiLimiter,
    authLimiter,
    transferLimiter,
    withdrawalLimiter
};
