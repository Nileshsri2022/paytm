// Audit Log Schema - tracks sensitive operations
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'login', 'logout', 'signup',
            'transfer', 'deposit', 'withdrawal',
            'profile_update', 'password_change',
            'limit_exceeded', 'auth_failure'
        ]
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: String,
    userAgent: String,
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success'
    }
}, { timestamps: true });

// Index for faster queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

/**
 * Log an audit event
 */
async function logAudit(userId, action, details = {}, req = null, status = 'success') {
    try {
        await AuditLog.create({
            userId,
            action,
            details,
            status,
            ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown',
            userAgent: req?.headers?.['user-agent'] || 'unknown'
        });
    } catch (error) {
        console.error('Audit log error:', error);
    }
}

module.exports = { AuditLog, logAudit };
