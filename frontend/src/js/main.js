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

console.log('[Main] Imported modules successfully');

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

console.log('[Main] Exported functions to global scope');
console.log('[Main] window.loadPDF is:', typeof window.loadPDF);

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Main] DOMContentLoaded event fired');
    console.log('[Main] Initializing application from main.js...');
    
    // Initialize all modules except settings (handled by direct script)
    initModals();
    initTheme(); // Initialize theme first to avoid flashing
    // initSettings(); // Commented out to avoid conflicts with direct script
    initSidebar();
    initChat();
    initFileTree();
    
    console.log('[Main] Core modules initialized');
    
    // Initialize PDF viewer if it exists
    const pdfContainer = document.getElementById('pdfPagesContainer');
    if (pdfContainer) {
        console.log('[Main] Found pdfPagesContainer, initializing PDF viewer');
        initPDF();
    } else {
        console.error('[Main] pdfPagesContainer not found, PDF viewer not initialized');
    }
    
    // Add direct event listener to settings button
    const settingsBtn = document.getElementById('sidebarSettingsBtn');
    if (settingsBtn) {
        console.log('[Main] Settings button found, adding direct event listener');
        settingsBtn.addEventListener('click', function() {
            console.log('[Main] Settings button clicked via event listener');
            openModal('settingsModal');
        });
    } else {
        console.error('[Main] Settings button not found');
    }
    
    // Test PDF loading function
    console.log('[Main] Testing if PDF functions are available in global scope:');
    console.log('[Main] window.loadPDF is:', typeof window.loadPDF);
    console.log('[Main] window.prevPage is:', typeof window.prevPage);
    console.log('[Main] window.nextPage is:', typeof window.nextPage);
    
    // Test loading a PDF directly
    setTimeout(() => {
        console.log('[Main] Attempting to load a test PDF directly');
        if (typeof window.loadPDF === 'function') {
            window.loadPDF('/frontend/public/assets/Files/final review.pdf');
        } else {
            console.error('[Main] window.loadPDF is not a function');
        }
    }, 2000);
    
    console.log('[Main] Application initialized successfully!');
}); 