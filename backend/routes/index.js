// backend/routes/index.js
const express = require('express');
const userRouter = require("./user");
const accountRouter = require("./account");
const googleRouter = require("./google");
const razorpayRouter = require("./razorpay");

const router = express.Router();

router.use("/user", userRouter);
router.use("/account", accountRouter);
router.use("/google", googleRouter);
router.use("/razorpay", razorpayRouter);

module.exports = router;