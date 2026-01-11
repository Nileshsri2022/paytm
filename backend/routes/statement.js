// Statement generation routes - PDF and CSV export
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware');
const { Transaction, User } = require('../db');

// Generate CSV statement
router.get('/csv', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const filter = {
            $or: [
                { fromUserId: req.userId },
                { toUserId: req.userId }
            ]
        };

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(filter)
            .populate('fromUserId', 'firstName lastName')
            .populate('toUserId', 'firstName lastName')
            .sort({ createdAt: -1 });

        // Build CSV
        const rows = ['Date,Type,Description,Amount,Status'];

        transactions.forEach(tx => {
            const isIncoming = tx.toUserId?._id?.toString() === req.userId.toString();
            const date = new Date(tx.createdAt).toLocaleDateString('en-IN');
            const type = tx.type;
            const desc = tx.description || `${tx.type} transaction`;
            const amount = isIncoming ? `+${tx.amount}` : `-${tx.amount}`;
            const status = tx.status;

            rows.push(`${date},"${type}","${desc}",${amount},${status}`);
        });

        const csv = rows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=statement_${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('CSV generation error:', error);
        res.status(500).json({ message: 'Failed to generate statement' });
    }
});

// Get statement data (for frontend PDF generation)
router.get('/data', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const filter = {
            $or: [
                { fromUserId: req.userId },
                { toUserId: req.userId }
            ]
        };

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const [transactions, user] = await Promise.all([
            Transaction.find(filter)
                .populate('fromUserId', 'firstName lastName')
                .populate('toUserId', 'firstName lastName')
                .sort({ createdAt: -1 }),
            User.findById(req.userId).select('firstName lastName username')
        ]);

        // Calculate summary
        let totalIn = 0, totalOut = 0;
        transactions.forEach(tx => {
            const isIncoming = tx.toUserId?._id?.toString() === req.userId.toString();
            if (isIncoming || tx.type === 'deposit') {
                totalIn += tx.amount;
            } else {
                totalOut += tx.amount;
            }
        });

        res.json({
            user: {
                name: `${user.firstName} ${user.lastName}`,
                email: user.username
            },
            transactions: transactions.map(tx => ({
                date: tx.createdAt,
                type: tx.type,
                description: tx.description,
                amount: tx.amount,
                status: tx.status,
                isIncoming: tx.toUserId?._id?.toString() === req.userId.toString() || tx.type === 'deposit'
            })),
            summary: {
                totalIn,
                totalOut,
                netChange: totalIn - totalOut,
                count: transactions.length
            },
            period: {
                start: startDate || 'All time',
                end: endDate || 'Present'
            }
        });
    } catch (error) {
        console.error('Statement data error:', error);
        res.status(500).json({ message: 'Failed to fetch statement data' });
    }
});

module.exports = router;
