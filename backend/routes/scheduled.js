// Scheduled Payments routes
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware');
const { ScheduledPayment, User, Account, Transaction } = require('../db');

// Get all scheduled payments for user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const payments = await ScheduledPayment.find({ userId: req.userId })
            .populate('beneficiaryId', 'firstName lastName username')
            .sort({ nextRunDate: 1 });
        res.json({ payments });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch scheduled payments' });
    }
});

// Create scheduled payment
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { beneficiaryId, amount, description, frequency, nextRunDate, endDate } = req.body;

        if (!beneficiaryId || !amount || !nextRunDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }

        // Verify beneficiary exists
        const beneficiary = await User.findById(beneficiaryId);
        if (!beneficiary) {
            return res.status(404).json({ message: 'Beneficiary not found' });
        }

        const payment = await ScheduledPayment.create({
            userId: req.userId,
            beneficiaryId,
            amount,
            description: description || 'Scheduled payment',
            frequency: frequency || 'once',
            nextRunDate: new Date(nextRunDate),
            endDate: endDate ? new Date(endDate) : null
        });

        const populated = await payment.populate('beneficiaryId', 'firstName lastName username');
        res.status(201).json({ message: 'Payment scheduled', payment: populated });
    } catch (error) {
        console.error('Schedule error:', error);
        res.status(500).json({ message: 'Failed to schedule payment' });
    }
});

// Pause/Resume scheduled payment
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
    try {
        const payment = await ScheduledPayment.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        payment.status = payment.status === 'active' ? 'paused' : 'active';
        await payment.save();

        res.json({ message: `Payment ${payment.status}`, payment });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update payment' });
    }
});

// Delete scheduled payment
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await ScheduledPayment.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!result) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json({ message: 'Scheduled payment deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete payment' });
    }
});

// Process due payments (called by cron or manually)
router.post('/process', async (req, res) => {
    try {
        const now = new Date();
        const duePayments = await ScheduledPayment.find({
            status: 'active',
            nextRunDate: { $lte: now }
        }).populate('userId beneficiaryId');

        let processed = 0, failed = 0;

        for (const payment of duePayments) {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                // Debit sender
                const senderAccount = await Account.findOneAndUpdate(
                    { userId: payment.userId._id, balance: { $gte: payment.amount } },
                    { $inc: { balance: -payment.amount } },
                    { session, new: true }
                );

                if (!senderAccount) {
                    payment.status = 'failed';
                    await payment.save();
                    await session.abortTransaction();
                    failed++;
                    continue;
                }

                // Credit receiver
                await Account.findOneAndUpdate(
                    { userId: payment.beneficiaryId._id },
                    { $inc: { balance: payment.amount } },
                    { session }
                );

                // Create transaction record
                await Transaction.create([{
                    type: 'transfer',
                    amount: payment.amount,
                    fromUserId: payment.userId._id,
                    toUserId: payment.beneficiaryId._id,
                    description: `Scheduled: ${payment.description}`,
                    status: 'completed'
                }], { session });

                await session.commitTransaction();

                // Update payment for next run
                payment.lastRunDate = now;
                payment.runCount += 1;

                if (payment.frequency === 'once') {
                    payment.status = 'completed';
                } else {
                    // Calculate next run date
                    const next = new Date(payment.nextRunDate);
                    if (payment.frequency === 'daily') next.setDate(next.getDate() + 1);
                    if (payment.frequency === 'weekly') next.setDate(next.getDate() + 7);
                    if (payment.frequency === 'monthly') next.setMonth(next.getMonth() + 1);

                    if (payment.endDate && next > payment.endDate) {
                        payment.status = 'completed';
                    } else {
                        payment.nextRunDate = next;
                    }
                }

                await payment.save();
                processed++;
            } catch (err) {
                await session.abortTransaction();
                failed++;
            } finally {
                session.endSession();
            }
        }

        res.json({ message: 'Processing complete', processed, failed });
    } catch (error) {
        console.error('Process error:', error);
        res.status(500).json({ message: 'Processing failed' });
    }
});

module.exports = router;
