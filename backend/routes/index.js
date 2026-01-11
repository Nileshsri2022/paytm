// backend/routes/index.js
const express = require('express');
const userRouter = require("./user");
const accountRouter = require("./account");
const googleRouter = require("./google");
const razorpayRouter = require("./razorpay");
const securityRouter = require("./security");
const beneficiaryRouter = require("./beneficiary");
const statementRouter = require("./statement");

const router = express.Router();

router.use("/user", userRouter);
router.use("/account", accountRouter);
router.use("/google", googleRouter);
router.use("/razorpay", razorpayRouter);
router.use("/security", securityRouter);
router.use("/beneficiaries", beneficiaryRouter);
router.use("/statement", statementRouter);

module.exports = router;