// backend/routes/google.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware');
const googleContactsService = require('../services/googleContacts');

// Store tokens temporarily (in production, save to database)
const tokenStore = new Map();

// Initiate Google OAuth
router.get('/auth', authMiddleware, (req, res) => {
    try {
        console.log('🔑 Starting OAuth for user:', req.userId);
        // Pass user ID in state to link after callback
        const authUrl = googleContactsService.getAuthUrl(req.userId);
        res.json({ authUrl });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ message: 'Failed to initiate Google auth' });
    }
});

// OAuth callback
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    console.log('📥 OAuth callback received, state (userId):', state);

    if (!code) {
        return res.redirect('http://localhost:5173/dashboard?google_error=no_code');
    }

    try {
        const tokens = await googleContactsService.getTokens(code);
        console.log('✅ Tokens received for user:', state);

        // Store tokens with user ID (state contains userId)
        if (state) {
            tokenStore.set(state, tokens);
            console.log('💾 Stored tokens. Current store keys:', Array.from(tokenStore.keys()));
        }

        // Redirect back to frontend with success
        res.redirect('http://localhost:5173/dashboard?google_success=true');
    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect('http://localhost:5173/dashboard?google_error=token_fetch');
    }
});

// Fetch user's Google contacts
router.get('/contacts', authMiddleware, async (req, res) => {
    try {
        console.log('📇 Fetching contacts for user:', req.userId);
        console.log('📦 Token store keys:', Array.from(tokenStore.keys()));

        const tokens = tokenStore.get(req.userId);
        console.log('🎫 Found tokens:', tokens ? 'YES' : 'NO');

        if (!tokens) {
            return res.status(401).json({
                message: 'Google not connected. Please connect your Google account first.',
                needsAuth: true
            });
        }

        const contacts = await googleContactsService.getContacts(tokens);
        console.log('👥 Fetched', contacts.length, 'contacts');
        res.json({ contacts });
    } catch (error) {
        console.error('Fetch contacts error:', error);

        if (error.code === 401) {
            tokenStore.delete(req.userId);
            return res.status(401).json({
                message: 'Google token expired. Please reconnect.',
                needsAuth: true
            });
        }

        res.status(500).json({ message: 'Failed to fetch contacts' });
    }
});

// Check if Google is connected
router.get('/status', authMiddleware, (req, res) => {
    console.log('🔍 Status check for user:', req.userId);
    console.log('📦 Token store keys:', Array.from(tokenStore.keys()));
    const isConnected = tokenStore.has(req.userId);
    console.log('✅ Connected:', isConnected);
    res.json({ connected: isConnected });
});

// Disconnect Google
router.post('/disconnect', authMiddleware, (req, res) => {
    tokenStore.delete(req.userId);
    res.json({ message: 'Google account disconnected' });
});

module.exports = router;
