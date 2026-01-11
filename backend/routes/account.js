// backend/routes/account.js
const express = require('express');
const { authMiddleware } = require('../middleware');
const { Account, Transaction, User } = require('../db');
const { default: mongoose } = require('mongoose');
const { validateTransactionLimits, recordTransfer } = require('../services/transactionLimits');

const router = express.Router();

router.get("/balance", authMiddleware, async (req, res) => {
    const account = await Account.findOne({
        userId: req.userId
    });

    res.json({
        balance: account.balance
    })
});

router.post("/transfer", authMiddleware, async (req, res) => {
    const { amount, to, pin } = req.body;

    // Validate amount is greater than 0
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    // Verify Transaction PIN
    const user = await User.findById(req.userId);
    if (!user.transactionPin?.isSet) {
        return res.status(400).json({ message: "Please set your transaction PIN first", needsPinSetup: true });
    }

    // Check if locked
    if (user.transactionPin?.lockedUntil && user.transactionPin.lockedUntil > new Date()) {
        const mins = Math.ceil((user.transactionPin.lockedUntil - new Date()) / 60000);
        return res.status(423).json({ message: `Account locked. Try after ${mins} minutes` });
    }

    if (!pin) {
        return res.status(400).json({ message: "Transaction PIN required", needsPin: true });
    }

    const bcrypt = require('bcrypt');
    const validPin = await bcrypt.compare(pin, user.transactionPin.hash);
    if (!validPin) {
        const attempts = (user.transactionPin.failedAttempts || 0) + 1;
        const update = { 'transactionPin.failedAttempts': attempts };
        if (attempts >= 3) {
            update['transactionPin.lockedUntil'] = new Date(Date.now() + 30 * 60 * 1000);
        }
        await User.findByIdAndUpdate(req.userId, update);
        if (attempts >= 3) {
            return res.status(423).json({ message: 'Too many attempts. Locked for 30 minutes' });
        }
        return res.status(400).json({ message: `Incorrect PIN. ${3 - attempts} attempts left` });
    }

    // Reset failed attempts on success
    await User.findByIdAndUpdate(req.userId, {
        'transactionPin.failedAttempts': 0,
        'transactionPin.lockedUntil': null
    });

    // Validate transaction limits (before starting DB transaction)
    const limitCheck = await validateTransactionLimits(req.userId, amount);
    if (!limitCheck.allowed) {
        return res.status(400).json({ message: limitCheck.reason });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Fetch the accounts within the transaction
        const account = await Account.findOne({ userId: req.userId }).session(session);

        if (!account || account.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Insufficient balance"
            });
        }

        const toAccount = await Account.findOne({ userId: to }).session(session);

        if (!toAccount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Invalid account"
            });
        }

        // Perform the transfer
        await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
        await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);

        // Log the transaction
        const transaction = new Transaction({
            fromUserId: req.userId,
            toUserId: to,
            amount: amount,
            type: 'transfer',
            status: 'completed',
            description: `Transfer to user`,
            paymentMethod: 'wallet_transfer'
        });
        await transaction.save({ session });

        // Commit the transaction
        await session.commitTransaction();

        // Record transfer for daily limit tracking
        await recordTransfer(req.userId, amount);

        res.json({
            message: "Transfer successful"
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('Transfer error:', error);
        res.status(500).json({ message: "Transfer failed" });
    } finally {
        session.endSession();
    }
});

// Add money to wallet
router.post("/add-money", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { amount, paymentMethod, description } = req.body;

        if (!amount || amount <= 0) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Invalid amount"
            });
        }

        // Update account balance
        await Account.updateOne(
            { userId: req.userId },
            { $inc: { balance: amount } },
            { session }
        );

        // Log the transaction
        const transaction = new Transaction({
            fromUserId: req.userId, // For deposits, fromUserId is the same as toUserId
            toUserId: req.userId,
            amount: amount,
            type: 'deposit',
            status: 'completed',
            description: description || `Added money via ${paymentMethod}`,
            paymentMethod: paymentMethod
        });
        await transaction.save({ session });

        await session.commitTransaction();
        res.json({
            message: "Money added successfully"
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            message: "Failed to add money"
        });
    }
});

// Withdraw money from wallet
router.post("/withdraw", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { amount, paymentMethod, description } = req.body;

        if (!amount || amount <= 0) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Invalid amount"
            });
        }

        // Check if user has sufficient balance
        const account = await Account.findOne({ userId: req.userId }).session(session);

        if (!account || account.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Insufficient balance"
            });
        }

        // Update account balance
        await Account.updateOne(
            { userId: req.userId },
            { $inc: { balance: -amount } },
            { session }
        );

        // Log the transaction
        const transaction = new Transaction({
            fromUserId: req.userId,
            toUserId: req.userId, // For withdrawals, toUserId is the same as fromUserId
            amount: amount,
            type: 'withdrawal',
            status: 'completed',
            description: description || `Withdrew money via ${paymentMethod}`,
            paymentMethod: paymentMethod
        });
        await transaction.save({ session });

        await session.commitTransaction();
        res.json({
            message: "Withdrawal successful"
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            message: "Failed to withdraw money"
        });
    }
});

// Get transaction history
router.get("/transactions", authMiddleware, async (req, res) => {
    try {
        const transactions = await Transaction.find({
            $or: [
                { fromUserId: req.userId },
                { toUserId: req.userId }
            ]
        })
            .populate('fromUserId', 'firstName lastName username')
            .populate('toUserId', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50 transactions

        res.json({
            transactions: transactions
        });
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        res.status(500).json({
            message: "Failed to fetch transactions"
        });
    }
});

// Generate payment QR code data
router.post("/generate-qr", authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;

        if (amount && (isNaN(amount) || amount <= 0)) {
            return res.status(400).json({
                message: "Invalid amount"
            });
        }

        // Get user info from database
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        // Generate QR data that contains user info and optional amount
        const qrData = {
            type: "paytm_payment",
            userId: req.userId,
            userName: user.firstName + " " + user.lastName,
            amount: amount || null, // null means user can enter any amount
            timestamp: Date.now()
        };

        res.json({
            qrData: qrData,
            message: "QR code generated successfully"
        });
    } catch (error) {
        console.error("Failed to generate QR:", error);
        res.status(500).json({
            message: "Failed to generate QR code"
        });
    }
});

// Scan and pay - validate scanned QR code
router.post("/scan-pay", authMiddleware, async (req, res) => {
    try {
        const { qrData, amount } = req.body;

        if (!qrData || qrData.type !== "paytm_payment") {
            return res.status(400).json({
                message: "Invalid QR code"
            });
        }

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                message: "Invalid amount"
            });
        }

        // Get recipient info
        const recipientUser = await User.findById(qrData.userId);
        if (!recipientUser) {
            return res.status(400).json({
                message: "Recipient not found"
            });
        }

        // Check if user is trying to pay themselves
        if (qrData.userId === req.userId) {
            return res.status(400).json({
                message: "Cannot pay yourself"
            });
        }

        // Get sender's account
        const senderAccount = await Account.findOne({ userId: req.userId });
        if (!senderAccount || senderAccount.balance < amount) {
            return res.status(400).json({
                message: "Insufficient balance"
            });
        }

        res.json({
            recipient: {
                id: recipientUser._id,
                name: recipientUser.firstName + " " + recipientUser.lastName,
                amount: amount
            },
            message: "Payment details validated"
        });
    } catch (error) {
        console.error("Failed to validate payment:", error);
        res.status(500).json({
            message: "Failed to validate payment"
        });
    }
});

// Confirm payment - process the transaction
router.post("/confirm-payment", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { recipientId, amount, description } = req.body;

        if (!recipientId || !amount || isNaN(amount) || amount <= 0) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Invalid payment details"
            });
        }

        // Get accounts
        const senderAccount = await Account.findOne({ userId: req.userId }).session(session);
        const recipientAccount = await Account.findOne({ userId: recipientId }).session(session);

        if (!senderAccount || senderAccount.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Insufficient balance"
            });
        }

        if (!recipientAccount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Recipient account not found"
            });
        }

        // Perform the transfer
        await Account.updateOne(
            { userId: req.userId },
            { $inc: { balance: -amount } },
            { session }
        );

        await Account.updateOne(
            { userId: recipientId },
            { $inc: { balance: amount } },
            { session }
        );

        // Log the transaction
        const transaction = new Transaction({
            fromUserId: req.userId,
            toUserId: recipientId,
            amount: amount,
            type: 'transfer',
            status: 'completed',
            description: description || `Scan & Pay to ${recipientAccount.userId}`,
            paymentMethod: 'scan_pay'
        });
        await transaction.save({ session });

        await session.commitTransaction();
        res.json({
            message: "Payment successful"
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Failed to process payment:", error);
        res.status(500).json({
            message: "Failed to process payment"
        });
    }
});

module.exports = router;
