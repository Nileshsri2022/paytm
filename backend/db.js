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
    // RazorpayX fields
    razorpayContactId: String,
    razorpayFundAccountId: String,
    bankDetails: {
        accountName: String,
        ifsc: String,
        accountNumber: String // Last 4 digits only
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

const Account = mongoose.model('Account', accountSchema);
const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = {
    User,
    Account,
    Transaction
};
