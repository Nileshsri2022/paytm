// Analytics routes - spending insights and statistics
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware');
const { Transaction, User } = require('../db');
const mongoose = require('mongoose');

// Get spending analytics
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.userId);
        const { period = 'month' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate;
        if (period === 'week') {
            startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (period === 'month') {
            startDate = new Date(now.setMonth(now.getMonth() - 1));
        } else if (period === 'year') {
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        } else {
            startDate = new Date(0); // All time
        }

        // Get all transactions for user
        const transactions = await Transaction.find({
            $or: [{ fromUserId: userId }, { toUserId: userId }],
            createdAt: { $gte: startDate },
            status: 'completed'
        }).populate('fromUserId toUserId', 'firstName lastName')
            .sort({ createdAt: -1 });

        // Calculate totals
        let totalSent = 0;
        let totalReceived = 0;
        const sentTransactions = [];
        const receivedTransactions = [];

        transactions.forEach(tx => {
            if (tx.fromUserId?._id?.toString() === req.userId.toString()) {
                totalSent += tx.amount;
                sentTransactions.push(tx);
            }
            if (tx.toUserId?._id?.toString() === req.userId.toString()) {
                totalReceived += tx.amount;
                receivedTransactions.push(tx);
            }
        });

        // Monthly breakdown (last 6 months)
        const monthlyData = await Transaction.aggregate([
            {
                $match: {
                    $or: [{ fromUserId: userId }, { toUserId: userId }],
                    status: 'completed',
                    createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
                }
            },
            {
                $project: {
                    amount: 1,
                    month: { $month: '$createdAt' },
                    year: { $year: '$createdAt' },
                    isSent: { $eq: ['$fromUserId', userId] },
                    isReceived: { $eq: ['$toUserId', userId] }
                }
            },
            {
                $group: {
                    _id: { month: '$month', year: '$year' },
                    sent: { $sum: { $cond: ['$isSent', '$amount', 0] } },
                    received: { $sum: { $cond: ['$isReceived', '$amount', 0] } }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Top recipients
        const topRecipients = await Transaction.aggregate([
            {
                $match: {
                    fromUserId: userId,
                    status: 'completed',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$toUserId',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalAmount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    name: { $concat: ['$user.firstName', ' ', { $ifNull: ['$user.lastName', ''] }] },
                    totalAmount: 1,
                    count: 1
                }
            }
        ]);

        // Top senders
        const topSenders = await Transaction.aggregate([
            {
                $match: {
                    toUserId: userId,
                    status: 'completed',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$fromUserId',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalAmount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    name: { $concat: ['$user.firstName', ' ', { $ifNull: ['$user.lastName', ''] }] },
                    totalAmount: 1,
                    count: 1
                }
            }
        ]);

        // Category breakdown (based on transaction descriptions)
        const categories = {
            'Split': 0,
            'Request': 0,
            'Scheduled': 0,
            'Transfer': 0
        };
        sentTransactions.forEach(tx => {
            if (tx.description?.includes('Split')) categories['Split'] += tx.amount;
            else if (tx.description?.includes('request')) categories['Request'] += tx.amount;
            else if (tx.description?.includes('Scheduled')) categories['Scheduled'] += tx.amount;
            else categories['Transfer'] += tx.amount;
        });

        res.json({
            summary: {
                totalSent,
                totalReceived,
                netFlow: totalReceived - totalSent,
                transactionCount: transactions.length
            },
            monthlyBreakdown: monthlyData,
            topRecipients,
            topSenders,
            categories: Object.entries(categories)
                .filter(([, v]) => v > 0)
                .map(([name, amount]) => ({ name, amount }))
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
});

module.exports = router;
