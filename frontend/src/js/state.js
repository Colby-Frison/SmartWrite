/**
 * state.js - Manages shared state between modules
 */

// Shared state object
const state = {
    currentPDF: null,
    currentZoom: 1.0,
    darkMode: false
};

// Get current PDF
export function getCurrentPDF() {
    return state.currentPDF;
}

// Set current PDF
export function setCurrentPDF(pdf) {
    state.currentPDF = pdf;
}

// Get current zoom level
export function getCurrentZoom() {
    return state.currentZoom;
}

// Set current zoom level
export function setCurrentZoom(zoom) {
    state.currentZoom = zoom;
}

// Get dark mode state
export function getDarkMode() {
    return state.darkMode;
}

// Set dark mode state
export function setDarkMode(isDark) {
    state.darkMode = isDark;
} 