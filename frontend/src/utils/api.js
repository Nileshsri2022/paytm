// frontend/src/utils/api.js
// API helper that uses Clerk token for authenticated requests

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE
});

// Token getter function - will be set by App component
let getAuthToken = null;

export const setTokenGetter = (getter) => {
    getAuthToken = getter;
};

// Request interceptor to add auth header
api.interceptors.request.use(async (config) => {
    if (getAuthToken) {
        try {
            const token = await getAuthToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting auth token:', error);
        }
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Token expired or invalid - redirect to signin
            window.location.href = '/signin';
        }
        return Promise.reject(error);
    }
);

export default api;
