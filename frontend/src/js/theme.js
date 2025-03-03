/**
 * theme.js - Handles theme-related functionality
 */

import { getDarkMode, setDarkMode } from './state.js';

// Toggle between light and dark theme
function toggleTheme() {
    const isDarkMode = getDarkMode();
    const newDarkMode = !isDarkMode;
    
    document.documentElement.setAttribute('data-theme', newDarkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', newDarkMode);
    setDarkMode(newDarkMode);
}

// Initialize theme based on saved preference
function initTheme() {
    const savedTheme = localStorage.getItem('darkMode');
    
    if (savedTheme !== null) {
        const isDarkMode = savedTheme === 'true';
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        setDarkMode(isDarkMode);
    } else {
        // Check for system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            setDarkMode(true);
        }
    }
    
    // Set up theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.checked = getDarkMode();
        themeToggle.addEventListener('change', function() {
            document.documentElement.setAttribute('data-theme', this.checked ? 'dark' : 'light');
            localStorage.setItem('darkMode', this.checked);
            setDarkMode(this.checked);
        });
    }
}

export { toggleTheme, initTheme }; 