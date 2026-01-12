// Request Money routes
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware');
const { PaymentRequest, User, Account, Transaction } = require('../db');
const NotificationService = require('../services/notificationService');

// Get requests (sent and received)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [sent, received] = await Promise.all([
            PaymentRequest.find({ fromUserId: req.userId })
                .populate('toUserId', 'firstName lastName username')
                .sort({ createdAt: -1 }),
            PaymentRequest.find({ toUserId: req.userId })
                .populate('fromUserId', 'firstName lastName username')
                .sort({ createdAt: -1 })
        ]);
        res.json({ sent, received });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch requests' });
    }
});

// Get pending requests count (for notification badge)
router.get('/pending-count', authMiddleware, async (req, res) => {
    try {
        const count = await PaymentRequest.countDocuments({
            toUserId: req.userId,
            status: 'pending'
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ count: 0 });
    }
});

// Create payment request
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { toUserId, amount, message } = req.body;

        if (!toUserId || !amount) {
            return res.status(400).json({ message: 'Recipient and amount required' });
        }

        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }

        if (toUserId === req.userId.toString()) {
            return res.status(400).json({ message: 'Cannot request money from yourself' });
        }

        const recipient = await User.findById(toUserId);
        if (!recipient) {
            return res.status(404).json({ message: 'User not found' });
        }

        const request = await PaymentRequest.create({
            fromUserId: req.userId,
            toUserId,
            amount,
            message: message || `Payment request`
        });

        // Notify recipient about request
        const requester = await User.findById(req.userId);
        NotificationService.requestReceived(toUserId, requester.firstName || 'Someone', amount);

        const populated = await request.populate('toUserId', 'firstName lastName username');
        res.status(201).json({ message: 'Request sent', request: populated });
    } catch (error) {
        console.error('Request error:', error);
        res.status(500).json({ message: 'Failed to create request' });
    }
});

// Pay the request
router.post('/:id/pay', authMiddleware, async (req, res) => {
    const { pin } = req.body;
    const bcrypt = require('bcrypt');

    // Verify Transaction PIN first
    const user = await User.findById(req.userId);
    if (!user.transactionPin?.isSet) {
        return res.status(400).json({ message: "Please set your transaction PIN first", needsPinSetup: true });
    }

    if (user.transactionPin?.lockedUntil && user.transactionPin.lockedUntil > new Date()) {
        const mins = Math.ceil((user.transactionPin.lockedUntil - new Date()) / 60000);
        return res.status(423).json({ message: `Account locked. Try after ${mins} minutes` });
    }

    if (!pin) {
        return res.status(400).json({ message: "Transaction PIN required", needsPin: true });
    }

    const pinValid = await bcrypt.compare(pin, user.transactionPin.hash);
    if (!pinValid) {
        user.transactionPin.failedAttempts += 1;
        if (user.transactionPin.failedAttempts >= 3) {
            user.transactionPin.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        await user.save();
        return res.status(401).json({ message: "Invalid PIN" });
    }

    // Reset failed attempts on success
    await User.findByIdAndUpdate(req.userId, {
        'transactionPin.failedAttempts': 0,
        'transactionPin.lockedUntil': null
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const request = await PaymentRequest.findOne({
            _id: req.params.id,
            toUserId: req.userId,
            status: 'pending'
        }).populate('fromUserId', 'firstName lastName');

        if (!request) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Request not found or already processed' });
        }

        // Debit payer
        const payerAccount = await Account.findOneAndUpdate(
            { userId: req.userId, balance: { $gte: request.amount } },
            { $inc: { balance: -request.amount } },
            { session, new: true }
        );

        if (!payerAccount) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Credit requester
        await Account.findOneAndUpdate(
            { userId: request.fromUserId._id },
            { $inc: { balance: request.amount } },
            { session }
        );

        // Create transaction
        await Transaction.create([{
            type: 'transfer',
            amount: request.amount,
            fromUserId: req.userId,
            toUserId: request.fromUserId._id,
            description: `Paid request: ${request.message}`,
            status: 'completed'
        }], { session });

        // Update request status
        request.status = 'paid';
        await request.save({ session });

        await session.commitTransaction();

        // Notify requester that their request was paid
        const payer = await User.findById(req.userId);
        NotificationService.requestPaid(
            request.fromUserId._id,
            payer.firstName || 'Someone',
            request.amount
        );

        res.json({ message: 'Payment successful', request });
    } catch (error) {
        await session.abortTransaction();
        console.error('Pay error:', error);
        res.status(500).json({ message: 'Payment failed' });
    } finally {
        session.endSession();
    }
});

// Decline request
router.post('/:id/decline', authMiddleware, async (req, res) => {
    try {
        const request = await PaymentRequest.findOneAndUpdate(
            { _id: req.params.id, toUserId: req.userId, status: 'pending' },
            { status: 'declined' },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.json({ message: 'Request declined', request });
    } catch (error) {
        res.status(500).json({ message: 'Failed to decline' });
    }
});

// Cancel request (by requester)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await PaymentRequest.findOneAndDelete({
            _id: req.params.id,
            fromUserId: req.userId,
            status: 'pending'
        });

        if (!result) {
            return res.status(404).json({ message: 'Request not found or already processed' });
        }

        res.json({ message: 'Request cancelled' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to cancel' });
    }
});

module.exports = router;

