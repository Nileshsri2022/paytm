// Transaction limit validation helper
const { User } = require('../db');

/**
 * Check if a transfer amount is within user's transaction limits
 * @param {string} userId - MongoDB user ID
 * @param {number} amount - Transfer amount
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
async function validateTransactionLimits(userId, amount) {
    const user = await User.findById(userId);
    if (!user) {
        return { allowed: false, reason: 'User not found' };
    }

    const limits = user.transactionLimits || {
        perTransaction: 10000,
        daily: 50000,
        monthly: 500000
    };

    // Check per-transaction limit
    if (amount > limits.perTransaction) {
        return {
            allowed: false,
            reason: `Amount exceeds per-transaction limit of ₹${limits.perTransaction}`
        };
    }

    // Check and reset daily limit if needed
    const now = new Date();
    const lastReset = new Date(user.dailyTransfers?.lastReset || 0);
    const isNewDay = now.toDateString() !== lastReset.toDateString();

    let dailyAmount = isNewDay ? 0 : (user.dailyTransfers?.amount || 0);

    if (dailyAmount + amount > limits.daily) {
        return {
            allowed: false,
            reason: `Amount exceeds daily limit. Remaining: ₹${limits.daily - dailyAmount}`
        };
    }

    return { allowed: true };
}

/**
 * Update user's daily transfer tracking after successful transfer
 * @param {string} userId - MongoDB user ID
 * @param {number} amount - Transfer amount
 */
async function recordTransfer(userId, amount) {
    const user = await User.findById(userId);
    if (!user) return;

    const now = new Date();
    const lastReset = new Date(user.dailyTransfers?.lastReset || 0);
    const isNewDay = now.toDateString() !== lastReset.toDateString();

    if (isNewDay) {
        user.dailyTransfers = { amount: amount, lastReset: now };
    } else {
        user.dailyTransfers.amount = (user.dailyTransfers?.amount || 0) + amount;
    }

    await user.save();
}

module.exports = {
    validateTransactionLimits,
    recordTransfer
};
