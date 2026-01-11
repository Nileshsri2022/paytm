// Custom hook for dark mode with localStorage persistence
import { useState, useEffect } from 'react';

export const useTheme = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) {
            return JSON.parse(saved);
        }
        // Check system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        // Apply theme to document
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        // Persist to localStorage
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    return { isDarkMode, toggleTheme };
};
