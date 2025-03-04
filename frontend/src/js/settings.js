/**
 * settings.js - Handles all settings-related functionality
 */

import { closeModal } from './modal.js';
import { getCurrentPDF, setCurrentZoom, setDarkMode } from './state.js';

// Global variable to store current PDF (will be set by pdf.js)
let currentPDF;

// Set the current PDF reference
export function setCurrentPDF(pdf) {
    currentPDF = pdf;
}

// Save settings to localStorage
function saveSettings() {
    const themeToggle = document.getElementById('themeToggle');
    const defaultZoom = document.getElementById('defaultZoom');
    
    // Save settings to localStorage
    localStorage.setItem('darkMode', themeToggle.checked);
    localStorage.setItem('defaultZoom', defaultZoom.value);
    
    // Apply settings
    document.documentElement.setAttribute('data-theme', themeToggle.checked ? 'dark' : 'light');
    setDarkMode(themeToggle.checked);
    
    // Update zoom level if a PDF is open
    if (getCurrentPDF()) {
        setCurrentZoom(parseFloat(defaultZoom.value));
    }
    
    closeModal('settingsModal');
}

// Save profile data to localStorage
function saveProfile() {
    const displayName = document.getElementById('displayName').value;
    const email = document.getElementById('email').value;
    const bio = document.getElementById('bio').value;
    
    // Save profile data to localStorage
    localStorage.setItem('userProfile', JSON.stringify({
        displayName,
        email,
        bio
    }));
    
    closeModal('profileModal');
}

// Initialize settings panels
function initSettingsPanels() {
    const settingsTabs = document.querySelectorAll('.settings-sidebar li');
    
    if (settingsTabs.length > 0) {
        settingsTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                settingsTabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Hide all panels
                document.querySelectorAll('.settings-panel').forEach(panel => {
                    panel.style.display = 'none';
                });
                
                // Show the selected panel
                const panelId = this.getAttribute('data-setting') + '-panel';
                const panel = document.getElementById(panelId);
                if (panel) {
                    panel.style.display = 'block';
                }
            });
        });
        
        // Initialize with the first tab active
        if (document.querySelector('.settings-sidebar li.active')) {
            const activeTab = document.querySelector('.settings-sidebar li.active');
            const panelId = activeTab.getAttribute('data-setting') + '-panel';
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.display = 'block';
            }
        }
    }
}

// Load saved settings
function loadSettings() {
    const savedTheme = localStorage.getItem('darkMode');
    const savedZoom = localStorage.getItem('defaultZoom');
    
    if (savedTheme !== null) {
        const isDarkMode = savedTheme === 'true';
        document.getElementById('themeToggle').checked = isDarkMode;
        setDarkMode(isDarkMode);
    }
    
    if (savedZoom !== null) {
        document.getElementById('defaultZoom').value = savedZoom;
        setCurrentZoom(parseFloat(savedZoom));
    }
    
    // Show the first panel by default
    const firstPanel = document.querySelector('.settings-panel');
    if (firstPanel) {
        firstPanel.style.display = 'block';
    }
}

// Initialize settings
function initSettings() {
    initSettingsPanels();
    loadSettings();
    
    // Add event listeners for save buttons
    const settingsSaveBtn = document.getElementById('settingsSaveBtn');
    if (settingsSaveBtn) {
        settingsSaveBtn.addEventListener('click', saveSettings);
    }
    
    const profileSaveBtn = document.getElementById('profileSaveBtn');
    if (profileSaveBtn) {
        profileSaveBtn.addEventListener('click', saveProfile);
    }
}

export { initSettings, saveSettings, saveProfile }; 