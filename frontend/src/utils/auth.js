// frontend/src/utils/auth.js
// Helper to get the correct auth token (Clerk or JWT)

export const getAuthToken = async () => {
    const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

    if (clerkKey) {
        // Try to get Clerk token
        try {
            const { useAuth } = await import('@clerk/clerk-react');
            // This won't work directly - need to use hook in component
            // Fall back to localStorage for now
        } catch (e) {
            // Clerk not available
        }
    }

    // Fall back to JWT token from localStorage
    return localStorage.getItem("token");
};

// For use in React components with Clerk
export const useAuthToken = () => {
    const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

    if (clerkKey) {
        try {
            const { useAuth } = require('@clerk/clerk-react');
            const { getToken } = useAuth();
            return { getToken: () => getToken(), isClerk: true };
        } catch (e) {
            // Clerk not available
        }
    }

    // Fall back to JWT
    return {
        getToken: () => Promise.resolve(localStorage.getItem("token")),
        isClerk: false
    };
};
