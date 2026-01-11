// Session & Security routes
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware');
const { AuditLog } = require('../services/auditLog');

// Get recent audit logs for current user
router.get('/audit-logs', authMiddleware, async (req, res) => {
    try {
        const logs = await AuditLog.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.json({ logs });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
});

// Get security summary (for dashboard)
router.get('/security-summary', authMiddleware, async (req, res) => {
    try {
        const lastLogin = await AuditLog.findOne({
            userId: req.userId,
            action: 'login',
            status: 'success'
        }).sort({ createdAt: -1 });

        const failedAttempts = await AuditLog.countDocuments({
            userId: req.userId,
            action: 'auth_failure',
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        const recentTransfers = await AuditLog.countDocuments({
            userId: req.userId,
            action: 'transfer',
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        res.json({
            lastLogin: lastLogin?.createdAt,
            failedAttemptsLast24h: failedAttempts,
            transfersLast24h: recentTransfers
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch security summary' });
    }
});

module.exports = router;
