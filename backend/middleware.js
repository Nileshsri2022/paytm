// backend/middleware.js
// Clerk-only authentication middleware

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No authorization token" });
    }

    const token = authHeader.split(' ')[1];
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;

    if (!clerkSecretKey) {
        return res.status(500).json({ message: "Server auth not configured" });
    }

    try {
        const { createClerkClient } = require('@clerk/clerk-sdk-node');
        const clerkClient = createClerkClient({ secretKey: clerkSecretKey });

        // Verify Clerk token
        const session = await clerkClient.verifyToken(token);
        req.clerkUserId = session.sub;

        // Look up or create MongoDB user
        const { User, Account } = require('./db');
        let user = await User.findOne({ clerkId: session.sub });

        if (!user) {
            // Auto-create user from Clerk
            const clerkUser = await clerkClient.users.getUser(session.sub);
            user = await User.create({
                clerkId: session.sub,
                username: clerkUser.emailAddresses[0]?.emailAddress || clerkUser.id,
                firstName: clerkUser.firstName || 'User',
                lastName: clerkUser.lastName || '',
                password: 'clerk-managed'
            });

            // Create account with initial balance
            await Account.create({
                userId: user._id,
                balance: 10000
            });
            console.log('✅ Created new user from Clerk:', user.username);
        }

        req.userId = user._id;
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

console.log('🔐 Clerk authentication enabled');

module.exports = {
    authMiddleware
}