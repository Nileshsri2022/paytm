// backend/routes/index.js
const express = require('express');
const userRouter = require("./user");
const accountRouter = require("./account");
const googleRouter = require("./google");
const razorpayRouter = require("./razorpay");
const securityRouter = require("./security");
const beneficiaryRouter = require("./beneficiary");
const statementRouter = require("./statement");
const scheduledRouter = require("./scheduled");
const requestsRouter = require("./requests");
const pinRouter = require("./pin");
const splitbillRouter = require("./splitbill");

const router = express.Router();

router.use("/user", userRouter);
router.use("/account", accountRouter);
router.use("/google", googleRouter);
router.use("/razorpay", razorpayRouter);
router.use("/security", securityRouter);
router.use("/beneficiaries", beneficiaryRouter);
router.use("/statement", statementRouter);
router.use("/scheduled", scheduledRouter);
router.use("/requests", requestsRouter);
router.use("/pin", pinRouter);
router.use("/splitbill", splitbillRouter);

module.exports = router;