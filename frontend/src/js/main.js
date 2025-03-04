/**
 * main.js - Main entry point for the application
 * Initializes all modules and sets up global functionality
 */

// Import modules
import * as state from './state.js';
import { openModal, closeModal, initModals } from './modal.js';
import { initSettings, saveSettings, saveProfile } from './settings.js';
import { initSidebar, toggleSidebar } from './sidebar.js';
import { initTheme, toggleTheme } from './theme.js';
import { initChat, sendChatMessage } from './chat.js';
import { initPDF, loadPDF, setZoomLevel, prevPage, nextPage } from './pdf.js';
import { initFileTree, createNewFolder, createNewNote, sortFileSystem } from './filetree.js';

// Make functions available globally
window.openModal = openModal;
window.closeModal = closeModal;
window.saveSettings = saveSettings;
window.saveProfile = saveProfile;
window.toggleSidebar = toggleSidebar;
window.toggleTheme = toggleTheme;
window.sendChatMessage = sendChatMessage;
window.loadPDF = loadPDF;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.createNewFolder = createNewFolder;
window.createNewNote = createNewNote;
window.sortFiles = sortFileSystem;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing application from main.js...');
    
    // Initialize all modules except settings (handled by direct script)
    initModals();
    initTheme(); // Initialize theme first to avoid flashing
    // initSettings(); // Commented out to avoid conflicts with direct script
    initSidebar();
    initChat();
    initFileTree();
    
    // Initialize PDF viewer if it exists
    const pdfCanvas = document.getElementById('pdf-canvas');
    if (pdfCanvas) {
        initPDF();
    }
    
    // Add direct event listener to settings button
    const settingsBtn = document.getElementById('sidebarSettingsBtn');
    if (settingsBtn) {
        console.log('Settings button found, adding direct event listener');
        settingsBtn.addEventListener('click', function() {
            console.log('Settings button clicked via event listener');
            openModal('settingsModal');
        });
    } else {
        console.error('Settings button not found');
    }
    
    console.log('Application initialized successfully!');
}); 