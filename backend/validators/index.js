// backend/validators/index.js
const { z } = require('zod');

// User schemas
const signupSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    username: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

const signinSchema = z.object({
    username: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required")
});

const updateUserSchema = z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    password: z.string().min(6).optional()
});

// Transfer schemas
const transferSchema = z.object({
    to: z.string().min(1, "Recipient ID is required"),
    amount: z.number().positive("Amount must be positive")
});

// Payment schemas
const addMoneySchema = z.object({
    amount: z.number().positive("Amount must be positive")
});

const withdrawSchema = z.object({
    amount: z.number().positive("Amount must be positive")
});

const bankAccountSchema = z.object({
    accountName: z.string().min(1, "Account name is required"),
    ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC format"),
    accountNumber: z.string().min(8, "Invalid account number")
});

// Validation helper
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        return res.status(400).json({
            message: "Validation failed",
            errors: error.errors
        });
    }
};

module.exports = {
    signupSchema,
    signinSchema,
    updateUserSchema,
    transferSchema,
    addMoneySchema,
    withdrawSchema,
    bankAccountSchema,
    validate
};
