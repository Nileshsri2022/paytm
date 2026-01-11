// Beneficiary routes - save favorite recipients
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware');
const { Beneficiary, User } = require('../db');

// Get all beneficiaries for current user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const beneficiaries = await Beneficiary.find({ userId: req.userId })
            .populate('beneficiaryId', 'firstName lastName username')
            .sort({ createdAt: -1 });

        res.json({ beneficiaries });
    } catch (error) {
        console.error('Failed to fetch beneficiaries:', error);
        res.status(500).json({ message: 'Failed to fetch beneficiaries' });
    }
});

// Add a new beneficiary
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { beneficiaryId, nickname } = req.body;

        if (!beneficiaryId) {
            return res.status(400).json({ message: 'Beneficiary ID required' });
        }

        // Can't add yourself
        if (beneficiaryId === req.userId.toString()) {
            return res.status(400).json({ message: 'Cannot add yourself as beneficiary' });
        }

        // Check if user exists
        const user = await User.findById(beneficiaryId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already exists
        const existing = await Beneficiary.findOne({
            userId: req.userId,
            beneficiaryId
        });

        if (existing) {
            return res.status(400).json({ message: 'Already saved as beneficiary' });
        }

        const beneficiary = await Beneficiary.create({
            userId: req.userId,
            beneficiaryId,
            nickname: nickname || `${user.firstName} ${user.lastName}`
        });

        const populated = await beneficiary.populate('beneficiaryId', 'firstName lastName username');

        res.status(201).json({
            message: 'Beneficiary added',
            beneficiary: populated
        });
    } catch (error) {
        console.error('Failed to add beneficiary:', error);
        res.status(500).json({ message: 'Failed to add beneficiary' });
    }
});

// Update beneficiary nickname
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { nickname } = req.body;

        const beneficiary = await Beneficiary.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { nickname },
            { new: true }
        ).populate('beneficiaryId', 'firstName lastName username');

        if (!beneficiary) {
            return res.status(404).json({ message: 'Beneficiary not found' });
        }

        res.json({ beneficiary });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update beneficiary' });
    }
});

// Delete beneficiary
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await Beneficiary.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!result) {
            return res.status(404).json({ message: 'Beneficiary not found' });
        }

        res.json({ message: 'Beneficiary removed' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove beneficiary' });
    }
});

module.exports = router;
