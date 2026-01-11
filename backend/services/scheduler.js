// Scheduler service - runs scheduled payments automatically
const cron = require('node-cron');
const mongoose = require('mongoose');
const { ScheduledPayment, Account, Transaction } = require('../db');

// Process due payments
const processScheduledPayments = async () => {
    console.log('⏰ Processing scheduled payments...', new Date().toISOString());

    const now = new Date();
    const duePayments = await ScheduledPayment.find({
        status: 'active',
        nextRunDate: { $lte: now }
    }).populate('userId beneficiaryId');

    if (duePayments.length === 0) {
        console.log('✅ No payments due');
        return;
    }

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
                console.log(`❌ Insufficient balance for payment ${payment._id}`);
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
            console.log(`✅ Processed: ₹${payment.amount} to ${payment.beneficiaryId.firstName}`);
            processed++;
        } catch (err) {
            console.error(`❌ Error processing payment ${payment._id}:`, err.message);
            await session.abortTransaction();
            failed++;
        } finally {
            session.endSession();
        }
    }

    console.log(`📊 Summary: ${processed} processed, ${failed} failed`);
};

// Start the scheduler
const startScheduler = () => {
    // Run every hour at minute 0 (e.g., 9:00, 10:00, 11:00)
    cron.schedule('0 * * * *', () => {
        processScheduledPayments();
    });

    console.log('🕐 Scheduler started - payments will process every hour');

    // Also process immediately on startup
    setTimeout(() => {
        processScheduledPayments();
    }, 5000);
};

module.exports = { startScheduler, processScheduledPayments };
