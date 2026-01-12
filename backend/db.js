// backend/db.js
const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config');

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Create a Schema for Users
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 50
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    // Clerk integration
    clerkId: {
        type: String,
        unique: true,
        sparse: true  // Allows null values (for non-Clerk users)
    },
    // Transaction limits
    transactionLimits: {
        perTransaction: { type: Number, default: 10000 },
        daily: { type: Number, default: 50000 },
        monthly: { type: Number, default: 500000 }
    },
    // Daily transfer tracking (resets at midnight)
    dailyTransfers: {
        amount: { type: Number, default: 0 },
        lastReset: { type: Date, default: Date.now }
    },
    // RazorpayX fields
    razorpayContactId: String,
    razorpayFundAccountId: String,
    bankDetails: {
        accountName: String,
        ifsc: String,
        accountNumber: String // Last 4 digits only
    },
    // Transaction PIN
    transactionPin: {
        hash: String,  // bcrypt hashed PIN
        isSet: { type: Boolean, default: false },
        failedAttempts: { type: Number, default: 0 },
        lockedUntil: Date
    }
});

const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to User model
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        required: true
    }
});

const transactionSchema = new mongoose.Schema({
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function () {
            return this.type !== 'deposit' && this.type !== 'withdrawal';
        }
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    type: {
        type: String,
        required: true,
        enum: ['transfer', 'deposit', 'withdrawal']
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'failed', 'processing'],
        default: 'completed'
    },
    description: {
        type: String,
        maxlength: 255
    },
    paymentMethod: {
        type: String,
        enum: ['wallet_transfer', 'upi', 'card', 'net_banking', 'bank_transfer'],
        required: function () {
            return this.type === 'deposit' || this.type === 'withdrawal';
        }
    },
    referenceId: {
        type: String,
        unique: true,
        sparse: true // Only required for certain transaction types
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Beneficiary Schema - saved recipients for quick payments
const beneficiarySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    beneficiaryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    nickname: {
        type: String,
        trim: true,
        maxLength: 50
    }
}, {
    timestamps: true
});

// Prevent duplicate beneficiaries
beneficiarySchema.index({ userId: 1, beneficiaryId: 1 }, { unique: true });

// Scheduled Payment Schema
const scheduledPaymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    beneficiaryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    description: {
        type: String,
        default: 'Scheduled payment'
    },
    frequency: {
        type: String,
        enum: ['once', 'daily', 'weekly', 'monthly'],
        default: 'once'
    },
    nextRunDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'completed', 'failed'],
        default: 'active'
    },
    lastRunDate: Date,
    runCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

scheduledPaymentSchema.index({ status: 1, nextRunDate: 1 });

// Payment Request Schema - request money from others
const paymentRequestSchema = new mongoose.Schema({
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // Requester
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // Who should pay
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    message: {
        type: String,
        maxLength: 200
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'declined', 'expired'],
        default: 'pending'
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
}, {
    timestamps: true
});

paymentRequestSchema.index({ toUserId: 1, status: 1 });

// Split Bill Schema - split expenses among friends
const splitBillSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        maxLength: 100
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 1
    },
    participants: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'declined'],
            default: 'pending'
        },
        paidAt: Date
    }],
    status: {
        type: String,
        enum: ['active', 'settled', 'cancelled'],
        default: 'active'
    }
}, {
    timestamps: true
});

splitBillSchema.index({ createdBy: 1, status: 1 });

const Account = mongoose.model('Account', accountSchema);
const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);
const ScheduledPayment = mongoose.model('ScheduledPayment', scheduledPaymentSchema);
const PaymentRequest = mongoose.model('PaymentRequest', paymentRequestSchema);
const SplitBill = mongoose.model('SplitBill', splitBillSchema);

module.exports = {
    User,
    Account,
    Transaction,
    Beneficiary,
    ScheduledPayment,
    PaymentRequest,
    SplitBill
};
