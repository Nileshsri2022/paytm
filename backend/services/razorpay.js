// backend/services/razorpay.js
// DRY Service for Razorpay/RazorpayX integration

const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayService {
    constructor() {
        this.instance = null;
    }

    // Lazy initialization to ensure env vars are loaded
    getInstance() {
        if (!this.instance) {
            const keyId = process.env.RAZORPAY_KEY_ID;
            const keySecret = process.env.RAZORPAY_KEY_SECRET;

            console.log('🔧 Razorpay Config:');
            console.log('   Key ID:', keyId ? `${keyId.substring(0, 15)}...` : '❌ MISSING');
            console.log('   Key Secret:', keySecret ? '✅ Set' : '❌ MISSING');

            if (!keyId || !keySecret) {
                throw new Error('Razorpay credentials not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
            }

            this.instance = new Razorpay({
                key_id: keyId,
                key_secret: keySecret
            });
        }
        return this.instance;
    }

    // Create order for adding money
    async createOrder(amount, currency = 'INR', receipt = null) {
        const options = {
            amount: amount * 100, // Razorpay expects paise
            currency,
            receipt: receipt || `order_${Date.now()}`,
            payment_capture: 1
        };

        const order = await this.getInstance().orders.create(options);
        console.log('📝 Order created:', order.id);
        return order;
    }

    // Verify payment signature
    verifyPaymentSignature(orderId, paymentId, signature) {
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        const body = orderId + '|' + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(body)
            .digest('hex');

        const isValid = expectedSignature === signature;
        console.log('🔐 Signature verification:', isValid ? '✅ Valid' : '❌ Invalid');
        return isValid;
    }

    // Get payment details
    async getPayment(paymentId) {
        return await this.getInstance().payments.fetch(paymentId);
    }

    // ========== RazorpayX Functions (Payouts) ==========

    // Create a contact (recipient)
    async createContact(name, email, type = 'customer', referenceId = null) {
        const contact = await this.getInstance().contacts.create({
            name,
            email,
            type,
            reference_id: referenceId
        });
        console.log('👤 Contact created:', contact.id);
        return contact;
    }

    // Create fund account (bank account)
    async createFundAccount(contactId, accountName, ifsc, accountNumber) {
        const fundAccount = await this.getInstance().fundAccount.create({
            contact_id: contactId,
            account_type: 'bank_account',
            bank_account: {
                name: accountName,
                ifsc,
                account_number: accountNumber
            }
        });
        console.log('🏦 Fund account created:', fundAccount.id);
        return fundAccount;
    }

    // Create payout
    async createPayout(fundAccountId, amount, purpose = 'payout', mode = 'IMPS') {
        const accountNumber = process.env.RAZORPAY_ACCOUNT_NUMBER;
        if (!accountNumber) {
            throw new Error('RAZORPAY_ACCOUNT_NUMBER not set in .env');
        }

        const payout = await this.getInstance().payouts.create({
            account_number: accountNumber,
            fund_account_id: fundAccountId,
            amount: amount * 100, // paise
            currency: 'INR',
            mode,
            purpose,
            queue_if_low_balance: true,
            reference_id: `payout_${Date.now()}`
        });
        console.log('💸 Payout created:', payout.id);
        return payout;
    }

    // Verify webhook signature
    verifyWebhookSignature(body, signature, secret) {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');
        return expectedSignature === signature;
    }
}

// Export singleton
module.exports = new RazorpayService();
