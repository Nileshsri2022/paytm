// Notification Service - helper to create notifications
const { Notification } = require('../db');

const NotificationService = {
    // Create a notification
    async create({ userId, type, title, message, data = null }) {
        try {
            return await Notification.create({ userId, type, title, message, data });
        } catch (error) {
            console.error('Failed to create notification:', error);
        }
    },

    // Payment received
    async paymentReceived(toUserId, fromUserName, amount) {
        return this.create({
            userId: toUserId,
            type: 'payment_received',
            title: 'Money Received! 💰',
            message: `You received ₹${amount} from ${fromUserName}`
        });
    },

    // Payment request received
    async requestReceived(toUserId, fromUserName, amount) {
        return this.create({
            userId: toUserId,
            type: 'request_received',
            title: 'Payment Request 📩',
            message: `${fromUserName} requested ₹${amount} from you`
        });
    },

    // Request was paid
    async requestPaid(toUserId, fromUserName, amount) {
        return this.create({
            userId: toUserId,
            type: 'request_paid',
            title: 'Request Paid! ✅',
            message: `${fromUserName} paid your request of ₹${amount}`
        });
    },

    // Split bill invite
    async splitInvite(toUserId, fromUserName, billTitle, amount) {
        return this.create({
            userId: toUserId,
            type: 'split_invite',
            title: 'Split Bill Invite ✂️',
            message: `${fromUserName} added you to "${billTitle}" - Your share: ₹${amount}`
        });
    },

    // Split paid
    async splitPaid(toUserId, fromUserName, billTitle, amount) {
        return this.create({
            userId: toUserId,
            type: 'split_paid',
            title: 'Split Paid! 💸',
            message: `${fromUserName} paid ₹${amount} for "${billTitle}"`
        });
    },

    // Low balance warning
    async lowBalance(userId, balance) {
        return this.create({
            userId,
            type: 'low_balance',
            title: 'Low Balance ⚠️',
            message: `Your balance is low: ₹${balance}`
        });
    },

    // Scheduled payment executed
    async scheduledPayment(userId, toUserName, amount) {
        return this.create({
            userId,
            type: 'scheduled_payment',
            title: 'Scheduled Payment Sent 📅',
            message: `Auto-payment of ₹${amount} sent to ${toUserName}`
        });
    }
};

module.exports = NotificationService;
