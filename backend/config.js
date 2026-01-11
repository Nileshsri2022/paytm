//backend/config.js
require('dotenv').config();

// Log environment loading status
console.log('🔧 Environment Variables Status:');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Loaded' : '❌ Using default');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Loaded' : '❌ Using default');
console.log('   JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || '24h (default)');

module.exports = {
	JWT_SECRET: process.env.JWT_SECRET || "your-jwt-secret",
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
	MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/paytm"
}