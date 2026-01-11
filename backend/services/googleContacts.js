// backend/services/googleContacts.js
// DRY Service for Google OAuth and Contacts

const { google } = require('googleapis');

class GoogleContactsService {
    constructor() {
        this.oauth2Client = null;
        this.scopes = [
            'https://www.googleapis.com/auth/contacts.readonly',
            'https://www.googleapis.com/auth/userinfo.email'
        ];
    }

    // Lazy initialization to ensure env vars are loaded
    getClient() {
        if (!this.oauth2Client) {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/google/callback';

            console.log('🔧 Google OAuth Config:');
            console.log('   Client ID:', clientId ? `${clientId.substring(0, 20)}...` : '❌ MISSING');
            console.log('   Client Secret:', clientSecret ? '✅ Set' : '❌ MISSING');
            console.log('   Redirect URI:', redirectUri);

            if (!clientId || !clientSecret) {
                throw new Error('Google OAuth credentials not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env');
            }

            this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        }
        return this.oauth2Client;
    }

    // Generate OAuth URL for user consent
    getAuthUrl(state = '') {
        const url = this.getClient().generateAuthUrl({
            access_type: 'offline',
            scope: this.scopes,
            state: state,
            prompt: 'consent'
        });
        console.log('📍 Generated Auth URL:', url);
        return url;
    }

    // Exchange code for tokens
    async getTokens(code) {
        const { tokens } = await this.getClient().getToken(code);
        return tokens;
    }

    // Set credentials for API calls
    setCredentials(tokens) {
        this.getClient().setCredentials(tokens);
    }

    // Fetch user's contacts from People API
    async getContacts(tokens) {
        this.setCredentials(tokens);

        const people = google.people({ version: 'v1', auth: this.getClient() });

        const response = await people.people.connections.list({
            resourceName: 'people/me',
            pageSize: 100,
            personFields: 'names,emailAddresses,phoneNumbers,photos'
        });

        const connections = response.data.connections || [];

        // Format contacts for our app
        return connections.map(person => ({
            name: person.names?.[0]?.displayName || 'Unknown',
            email: person.emailAddresses?.[0]?.value || null,
            phone: person.phoneNumbers?.[0]?.value || null,
            photo: person.photos?.[0]?.url || null,
            googleId: person.resourceName
        })).filter(contact => contact.email || contact.phone);
    }

    // Get user info
    async getUserInfo(tokens) {
        this.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: this.getClient() });
        const { data } = await oauth2.userinfo.get();
        return data;
    }
}

// Export singleton instance (DRY)
module.exports = new GoogleContactsService();
