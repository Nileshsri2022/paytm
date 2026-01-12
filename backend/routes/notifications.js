// Notification routes
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware');
const { Notification } = require('../db');

// Get all notifications
router.get('/', authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            userId: req.userId,
            read: false
        });

        res.json({ notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
});

// Get unread count only
router.get('/count', authMiddleware, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.userId,
            read: false
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get count' });
    }
});

// Mark one as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { read: true }
        );
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update' });
    }
});

// Mark all as read
router.patch('/read-all', authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.userId, read: false },
            { read: true }
        );
        res.json({ message: 'All marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update' });
    }
});

// Delete one notification
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete' });
    }
});

// Clear all notifications
router.delete('/', authMiddleware, async (req, res) => {
    try {
        await Notification.deleteMany({ userId: req.userId });
        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to clear' });
    }
});

module.exports = router;
