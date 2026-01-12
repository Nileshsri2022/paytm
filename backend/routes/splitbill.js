// Split Bill routes
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware');
const { SplitBill, User, Account, Transaction } = require('../db');

// Get all split bills (created + participating)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [created, participating] = await Promise.all([
            SplitBill.find({ createdBy: req.userId })
                .populate('participants.userId', 'firstName lastName')
                .sort({ createdAt: -1 }),
            SplitBill.find({
                'participants.userId': req.userId,
                createdBy: { $ne: req.userId }
            })
                .populate('createdBy', 'firstName lastName')
                .populate('participants.userId', 'firstName lastName')
                .sort({ createdAt: -1 })
        ]);
        res.json({ created, participating });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch split bills' });
    }
});

// Create split bill
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, totalAmount, participants, splitType = 'equal' } = req.body;

        if (!title || !totalAmount || !participants?.length) {
            return res.status(400).json({ message: 'Title, amount, and participants required' });
        }

        if (totalAmount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }

        // Calculate splits
        let splitParticipants;
        if (splitType === 'equal') {
            const perPerson = Math.round(totalAmount / (participants.length + 1)); // +1 for creator
            splitParticipants = participants.map(p => ({
                userId: p.userId,
                amount: perPerson,
                status: 'pending'
            }));
        } else {
            // Custom amounts
            splitParticipants = participants.map(p => ({
                userId: p.userId,
                amount: p.amount,
                status: 'pending'
            }));
        }

        const bill = await SplitBill.create({
            createdBy: req.userId,
            title,
            totalAmount,
            participants: splitParticipants
        });

        const populated = await bill.populate('participants.userId', 'firstName lastName');
        res.status(201).json({ message: 'Split bill created', bill: populated });
    } catch (error) {
        console.error('Create split error:', error);
        res.status(500).json({ message: 'Failed to create split bill' });
    }
});

// Pay my share
router.post('/:id/pay', authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const bill = await SplitBill.findById(req.params.id)
            .populate('createdBy', 'firstName lastName')
            .populate('participants.userId', 'firstName lastName');

        if (!bill) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Bill not found' });
        }

        const currentUserId = req.userId.toString();

        // Debug logging
        console.log('Pay request - Current user:', currentUserId);
        console.log('Participants:', bill.participants.map(p => ({
            id: (p.userId._id || p.userId).toString(),
            status: p.status
        })));

        const participant = bill.participants.find(p => {
            const participantId = (p.userId._id || p.userId).toString();
            return participantId === currentUserId && p.status === 'pending';
        });

        if (!participant) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'No pending payment found' });
        }

        // Debit payer
        const payerAccount = await Account.findOneAndUpdate(
            { userId: req.userId, balance: { $gte: participant.amount } },
            { $inc: { balance: -participant.amount } },
            { session, new: true }
        );

        if (!payerAccount) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Credit bill creator
        await Account.findOneAndUpdate(
            { userId: bill.createdBy._id },
            { $inc: { balance: participant.amount } },
            { session }
        );

        // Create transaction
        await Transaction.create([{
            type: 'transfer',
            amount: participant.amount,
            fromUserId: req.userId,
            toUserId: bill.createdBy._id,
            description: `Split: ${bill.title}`,
            status: 'completed'
        }], { session });

        // Update participant status
        participant.status = 'paid';
        participant.paidAt = new Date();

        // Check if all paid
        const allPaid = bill.participants.every(p => p.status === 'paid');
        if (allPaid) {
            bill.status = 'settled';
        }

        await bill.save({ session });
        await session.commitTransaction();

        res.json({ message: 'Payment successful', bill });
    } catch (error) {
        await session.abortTransaction();
        console.error('Pay split error:', error);
        res.status(500).json({ message: 'Payment failed' });
    } finally {
        session.endSession();
    }
});

// Decline my share
router.post('/:id/decline', authMiddleware, async (req, res) => {
    try {
        const bill = await SplitBill.findById(req.params.id);

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        const participant = bill.participants.find(
            p => (p.userId._id || p.userId).toString() === req.userId && p.status === 'pending'
        );

        if (!participant) {
            return res.status(400).json({ message: 'No pending payment found' });
        }

        participant.status = 'declined';
        await bill.save();

        res.json({ message: 'Declined', bill });
    } catch (error) {
        res.status(500).json({ message: 'Failed to decline' });
    }
});

// Send reminder (just returns success, could add notifications later)
router.post('/:id/remind', authMiddleware, async (req, res) => {
    try {
        const bill = await SplitBill.findOne({
            _id: req.params.id,
            createdBy: req.userId
        });

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        // Future: Send push notification/email to pending participants
        res.json({ message: 'Reminders sent!' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send reminders' });
    }
});

// Delete/Cancel split bill
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await SplitBill.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.userId,
            status: 'active'
        });

        if (!result) {
            return res.status(404).json({ message: 'Bill not found or already settled' });
        }

        res.json({ message: 'Bill cancelled' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to cancel' });
    }
});

module.exports = router;
