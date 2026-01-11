// backend/routes/razorpay.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware');
const razorpayService = require('../services/razorpay');
const { User, Account, Transaction } = require('../db');
const mongoose = require('mongoose');

// Create order for adding money
router.post('/create-order', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const order = await razorpayService.createOrder(amount);

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Failed to create order' });
    }
});

// Verify payment and credit wallet
router.post('/verify-payment', authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

        // Verify signature
        const isValid = razorpayService.verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        // Credit user's wallet
        await Account.updateOne(
            { userId: req.userId },
            { $inc: { balance: amount } }
        ).session(session);

        // Create transaction record
        await Transaction.create([{
            fromUserId: req.userId,  // For deposits, use the user receiving money
            toUserId: req.userId,
            amount,
            type: 'deposit',
            status: 'completed',
            paymentMethod: 'upi',  // Default for Razorpay payments
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id
        }], { session });

        await session.commitTransaction();

        res.json({
            success: true,
            message: 'Payment successful! Wallet credited.',
            paymentId: razorpay_payment_id
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('Verify payment error:', error);
        res.status(500).json({ message: 'Payment verification failed' });
    } finally {
        session.endSession();
    }
});

// Add bank account for payouts (SIMULATION MODE)
router.post('/add-bank-account', authMiddleware, async (req, res) => {
    try {
        const { accountName, ifsc, accountNumber } = req.body;

        if (!accountName || !ifsc || !accountNumber) {
            return res.status(400).json({ message: 'All bank details required' });
        }

        // Get user
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // SIMULATION: Just save bank details locally (no actual RazorpayX API call)
        user.razorpayFundAccountId = `sim_${Date.now()}`; // Simulated fund account ID
        user.bankDetails = {
            accountName,
            ifsc,
            accountNumber: accountNumber.slice(-4) // Store only last 4 digits
        };
        await user.save();

        console.log('✅ [SIMULATION] Bank account linked for user:', user._id);

        res.json({
            success: true,
            message: 'Bank account linked successfully (Simulation Mode)',
            fundAccountId: user.razorpayFundAccountId
        });
    } catch (error) {
        console.error('Add bank account error:', error);
        res.status(500).json({ message: 'Failed to link bank account' });
    }
});

// Withdraw to bank (payout) - SIMULATION MODE
router.post('/payout', authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        // Get user
        const user = await User.findById(req.userId);
        if (!user?.razorpayFundAccountId) {
            return res.status(400).json({ message: 'No bank account linked. Please add bank account first.' });
        }

        // Check balance
        const account = await Account.findOne({ userId: req.userId });
        if (account.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Debit wallet
        await Account.updateOne(
            { userId: req.userId },
            { $inc: { balance: -amount } }
        ).session(session);

        // SIMULATION: Create fake payout ID
        const simulatedPayoutId = `pout_sim_${Date.now()}`;

        // Create transaction record
        await Transaction.create([{
            fromUserId: req.userId,
            toUserId: null,
            amount,
            type: 'withdrawal',
            status: 'completed', // In simulation, mark as completed immediately
            paymentMethod: 'bank_transfer',
            razorpayPayoutId: simulatedPayoutId
        }], { session });

        await session.commitTransaction();

        console.log('💸 [SIMULATION] Payout completed:', simulatedPayoutId, 'Amount:', amount);

        res.json({
            success: true,
            message: `₹${amount} withdrawn successfully! (Simulation Mode)`,
            payoutId: simulatedPayoutId,
            status: 'completed'
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('Payout error:', error);
        res.status(500).json({ message: error.message || 'Payout failed' });
    } finally {
        session.endSession();
    }
});

// Webhook for Razorpay events (for production)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const body = req.body.toString();
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (webhookSecret) {
            const isValid = razorpayService.verifyWebhookSignature(body, signature, webhookSecret);
            if (!isValid) {
                return res.status(400).json({ message: 'Invalid webhook signature' });
            }
        }

        const event = JSON.parse(body);
        console.log('📬 Webhook received:', event.event);

        // Handle different events
        switch (event.event) {
            case 'payout.processed':
                // Update transaction status to completed
                await Transaction.updateOne(
                    { razorpayPayoutId: event.payload.payout.entity.id },
                    { status: 'completed' }
                );
                break;

            case 'payout.failed':
                // Refund the amount and update status
                const payout = event.payload.payout.entity;
                await Account.updateOne(
                    { userId: payout.reference_id?.split('_')[0] },
                    { $inc: { balance: payout.amount / 100 } }
                );
                await Transaction.updateOne(
                    { razorpayPayoutId: payout.id },
                    { status: 'failed' }
                );
                break;
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
});

module.exports = router;
