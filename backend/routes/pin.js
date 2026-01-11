// Transaction PIN routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { authMiddleware } = require('../middleware');
const { User } = require('../db');

// Check if PIN is set
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        res.json({
            isSet: user.transactionPin?.isSet || false,
            isLocked: user.transactionPin?.lockedUntil && user.transactionPin.lockedUntil > new Date()
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get PIN status' });
    }
});

// Set PIN (first time)
router.post('/set', authMiddleware, async (req, res) => {
    try {
        const { pin } = req.body;

        if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
            return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
        }

        const user = await User.findById(req.userId);

        if (user.transactionPin?.isSet) {
            return res.status(400).json({ message: 'PIN already set. Use change PIN.' });
        }

        const hash = await bcrypt.hash(pin, 10);

        await User.findByIdAndUpdate(req.userId, {
            transactionPin: {
                hash,
                isSet: true,
                failedAttempts: 0
            }
        });

        res.json({ message: 'PIN set successfully' });
    } catch (error) {
        console.error('Set PIN error:', error);
        res.status(500).json({ message: 'Failed to set PIN' });
    }
});

// Change PIN
router.post('/change', authMiddleware, async (req, res) => {
    try {
        const { oldPin, newPin } = req.body;

        if (!newPin || newPin.length !== 4 || !/^\d+$/.test(newPin)) {
            return res.status(400).json({ message: 'New PIN must be exactly 4 digits' });
        }

        const user = await User.findById(req.userId);

        if (!user.transactionPin?.isSet) {
            return res.status(400).json({ message: 'PIN not set. Use set PIN first.' });
        }

        const valid = await bcrypt.compare(oldPin, user.transactionPin.hash);
        if (!valid) {
            return res.status(400).json({ message: 'Incorrect current PIN' });
        }

        const hash = await bcrypt.hash(newPin, 10);

        await User.findByIdAndUpdate(req.userId, {
            'transactionPin.hash': hash,
            'transactionPin.failedAttempts': 0
        });

        res.json({ message: 'PIN changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to change PIN' });
    }
});

// Reset PIN (after email OTP verification via Clerk)
router.post('/reset', authMiddleware, async (req, res) => {
    try {
        const { newPin } = req.body;

        if (!newPin || newPin.length !== 4 || !/^\d+$/.test(newPin)) {
            return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
        }

        const hash = await bcrypt.hash(newPin, 10);

        await User.findByIdAndUpdate(req.userId, {
            transactionPin: {
                hash,
                isSet: true,
                failedAttempts: 0,
                lockedUntil: null
            }
        });

        res.json({ message: 'PIN reset successfully' });
    } catch (error) {
        console.error('Reset PIN error:', error);
        res.status(500).json({ message: 'Failed to reset PIN' });
    }
});

// Verify PIN (called internally before transfers)
router.post('/verify', authMiddleware, async (req, res) => {
    try {
        const { pin } = req.body;
        const user = await User.findById(req.userId);

        // Check if locked
        if (user.transactionPin?.lockedUntil && user.transactionPin.lockedUntil > new Date()) {
            const mins = Math.ceil((user.transactionPin.lockedUntil - new Date()) / 60000);
            return res.status(423).json({ message: `Account locked. Try after ${mins} minutes` });
        }

        if (!user.transactionPin?.isSet) {
            return res.status(400).json({ message: 'PIN not set', needsSetup: true });
        }

        const valid = await bcrypt.compare(pin, user.transactionPin.hash);

        if (!valid) {
            const attempts = (user.transactionPin.failedAttempts || 0) + 1;
            const update = { 'transactionPin.failedAttempts': attempts };

            // Lock after 3 failed attempts
            if (attempts >= 3) {
                update['transactionPin.lockedUntil'] = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
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

        res.json({ verified: true });
    } catch (error) {
        res.status(500).json({ message: 'Verification failed' });
    }
});

module.exports = router;
