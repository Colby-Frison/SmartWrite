/**
 * pdf.js - Handles all PDF-related functionality
 */

import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import { setCurrentPDF, getCurrentZoom, setCurrentZoom } from './state.js';

// Global variables
let currentPage = 1;
let pdfDoc = null;
let totalPages = 0;
let renderedPages = new Set();
let searchResults = [];
let currentSearchResultIndex = -1;
let currentZoom = 1.0;

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Set zoom level
function setZoomLevel(zoom) {
    console.log(`[PDF.js] Setting zoom level to ${zoom}`);
    
    // Limit zoom range
    zoom = Math.max(0.5, Math.min(2.0, zoom));
    currentZoom = zoom;
    
    // Update zoom level display
    const zoomLevelDisplay = document.getElementById('zoomLevel');
    if (zoomLevelDisplay) {
        zoomLevelDisplay.textContent = `${Math.round(zoom * 100)}%`;
    }
    
    // Re-render all pages with new zoom level
        if (pdfDoc) {
        const pdfContainer = document.getElementById('pdfContainer');
        if (pdfContainer) {
            pdfContainer.innerHTML = '';
        }
        
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            renderPage(pageNum);
        }
    }
}

// Render a single page
async function renderPage(pageNum) {
    console.log(`[PDF.js] Rendering page ${pageNum}`);
    
    try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: currentZoom });
        
        // Create page container
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page';
        pageContainer.dataset.pageNumber = pageNum;
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Create text layer
        const textLayer = document.createElement('div');
        textLayer.className = 'textLayer';
        textLayer.style.width = `${viewport.width}px`;
        textLayer.style.height = `${viewport.height}px`;
        
        // Create wrapper for canvas and text layer
        const wrapper = document.createElement('div');
        wrapper.className = 'pdf-page-wrapper';
        wrapper.style.width = `${viewport.width}px`;
        wrapper.style.height = `${viewport.height}px`;
        
        // Render page content
                const renderContext = {
            canvasContext: context,
                    viewport: viewport
                };
                
        await page.render(renderContext).promise;
        
        // Render text layer
        const textContent = await page.getTextContent();
        await renderTextLayer(textLayer, textContent, viewport);
        
        // Add elements to page container
        wrapper.appendChild(canvas);
        wrapper.appendChild(textLayer);
        pageContainer.appendChild(wrapper);
        
        // Add page container to PDF container
        const pdfContainer = document.getElementById('pdfContainer');
        if (pdfContainer) {
            pdfContainer.appendChild(pageContainer);
        }
        
        console.log(`[PDF.js] Page ${pageNum} rendered successfully`);
    } catch (error) {
        console.error(`[PDF.js] Error rendering page ${pageNum}:`, error);
        throw error;
    }
}

// Render text layer
async function renderTextLayer(textLayer, textContent, viewport) {
    const textLayerDiv = textLayer;
    textLayerDiv.innerHTML = '';
    
    // Render text content
    for (const item of textContent.items) {
        const textSpan = document.createElement('span');
        textSpan.textContent = item.str;
        textSpan.style.left = `${item.transform[4]}px`;
        textSpan.style.top = `${viewport.height - item.transform[5]}px`;
        textSpan.style.fontSize = `${Math.sqrt(item.transform[0] * item.transform[0] + item.transform[1] * item.transform[1])}px`;
        textLayerDiv.appendChild(textSpan);
    }
}

// Render all pages
async function renderAllPages() {
    console.log('[PDF] Rendering all pages');
    
    if (!pdfDoc) {
        console.error('[PDF] No PDF document loaded');
        return;
    }
    
    const pdfPagesContainer = document.getElementById('pdfPagesContainer');
    if (!pdfPagesContainer) {
        console.error('[PDF] pdfPagesContainer not found');
        return;
    }
    
    // Clear existing content
    pdfPagesContainer.innerHTML = '';
    
    // Show loading indicator
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'pdf-loading';
    loadingMessage.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rendering PDF...';
    pdfPagesContainer.appendChild(loadingMessage);
    
    try {
        // Render all pages
    const renderPromises = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        renderPromises.push(renderPage(i));
    }
    
        const pageDivs = await Promise.all(renderPromises);
        
        // Clear loading message
        pdfPagesContainer.innerHTML = '';
        
        // Add all pages to container
        pageDivs.forEach(pageDiv => {
            pdfPagesContainer.appendChild(pageDiv);
        });
        
        // Mark current page
        const currentPageDiv = pdfPagesContainer.querySelector(`.pdf-page[data-page-number="${currentPage}"]`);
        if (currentPageDiv) {
            currentPageDiv.classList.add('current-page');
                currentPageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        console.log('[PDF] All pages rendered successfully');
    } catch (error) {
        console.error('[PDF] Error rendering pages:', error);
        pdfPagesContainer.innerHTML = `<div class="pdf-error"><i class="fas fa-exclamation-triangle"></i> Error rendering PDF: ${error.message}</div>`;
    }
}

// Load a PDF from a URL
export async function loadPDF(url) {
    console.log('[PDF] Loading PDF from URL:', url);
    const pdfContainer = document.getElementById('pdfContainer');
    if (!pdfContainer) {
        throw new Error('PDF container not found');
    }

    try {
        // Show loading state
        pdfContainer.innerHTML = `
            <div class="pdf-loading">
                <div class="spinner"></div>
                <span>Loading PDF...</span>
            </div>
        `;

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        console.log('[PDF] PDF loaded successfully, rendering pages');

        // Clear the container
        pdfContainer.innerHTML = '';
        
        // Render all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            await renderPage(pageNum);
        }

        console.log('[PDF] All pages rendered successfully');
    } catch (error) {
        console.error('[PDF] Error loading PDF:', error);
        pdfContainer.innerHTML = `
            <div class="pdf-error">
                <p>Error loading PDF: ${error.message}</p>
                <a href="${url}" target="_blank">Download PDF instead</a>
            </div>
        `;
        throw error;
    }
}

// Search for text in the PDF
export function searchPDF(searchText) {
    console.log(`[PDF.js] Searching for text: "${searchText}"`);
    
    if (!searchText || searchText.trim() === '') {
        return;
    }
    
    // Use browser's built-in PDF search
    const pdfContainer = document.getElementById('pdfContainer');
    if (pdfContainer) {
        const objectElement = pdfContainer.querySelector('object');
        if (objectElement) {
            // Focus the PDF viewer
            objectElement.focus();
            // Use browser's find functionality
            window.find(searchText);
        }
    }
}

// Clear search results
function clearSearchResults() {
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => highlight.remove());
    
    searchResults = [];
    currentSearchResultIndex = -1;
    
    const searchResultsCount = document.getElementById('searchResultsCount');
    if (searchResultsCount) {
        searchResultsCount.textContent = '0/0';
    }
    
    const prevSearchBtn = document.getElementById('prevSearchResult');
    const nextSearchBtn = document.getElementById('nextSearchResult');
    if (prevSearchBtn) prevSearchBtn.disabled = true;
    if (nextSearchBtn) nextSearchBtn.disabled = true;
}

// Highlight search results
function highlightSearchResults() {
    const pdfPagesContainer = document.getElementById('pdfPagesContainer');
    if (!pdfPagesContainer) return;
    
    searchResults.forEach((result, index) => {
        const pageDiv = pdfPagesContainer.querySelector(`.pdf-page[data-page-number="${result.pageIndex}"]`);
        if (!pageDiv) return;
        
        const highlight = document.createElement('div');
        highlight.className = 'search-highlight';
        highlight.dataset.resultIndex = index;
        
        highlight.style.left = `${result.left}px`;
        highlight.style.top = `${result.top}px`;
        highlight.style.width = `${result.right - result.left}px`;
        highlight.style.height = `${result.bottom - result.top}px`;
        
        highlight.addEventListener('click', () => navigateToSearchResult(index));
        
        pageDiv.appendChild(highlight);
    });
}

// Navigate to a search result
function navigateToSearchResult(resultIndex) {
    if (resultIndex < 0 || resultIndex >= searchResults.length) return;
    
    const result = searchResults[resultIndex];
    currentSearchResultIndex = resultIndex;
    
    // Update UI
    const searchResultsCount = document.getElementById('searchResultsCount');
    if (searchResultsCount) {
        searchResultsCount.textContent = `${resultIndex + 1}/${searchResults.length}`;
    }
    
    // Go to page
    goToPage(result.pageIndex);
    
    // Highlight current result
    const currentHighlight = document.querySelector('.search-highlight.current');
    if (currentHighlight) currentHighlight.classList.remove('current');
    
    const highlight = document.querySelector(`.search-highlight[data-result-index="${resultIndex}"]`);
    if (highlight) {
        highlight.classList.add('current');
        setTimeout(() => highlight.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
}

// Navigate to next/previous search result
function nextSearchResult() {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchResultIndex + 1) % searchResults.length;
    navigateToSearchResult(nextIndex);
}

function prevSearchResult() {
    if (searchResults.length === 0) return;
    const prevIndex = (currentSearchResultIndex - 1 + searchResults.length) % searchResults.length;
    navigateToSearchResult(prevIndex);
}

// Go to a specific page
function goToPage(pageNum) {
    if (!pdfDoc || pageNum < 1 || pageNum > pdfDoc.numPages) return;
    
    currentPage = pageNum;
    
    const pdfPagesContainer = document.getElementById('pdfPagesContainer');
    if (!pdfPagesContainer) return;
    
    // Update current page class
        const allPages = pdfPagesContainer.querySelectorAll('.pdf-page');
        allPages.forEach(page => page.classList.remove('current-page'));
        
        const currentPageDiv = pdfPagesContainer.querySelector(`.pdf-page[data-page-number="${pageNum}"]`);
        if (currentPageDiv) {
            currentPageDiv.classList.add('current-page');
            currentPageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
}

// Initialize PDF functionality
export function initPDF() {
    console.log('[PDF] Initializing PDF.js');
    const pdfContainer = document.getElementById('pdfContainer');
    if (!pdfContainer) {
        console.error('[PDF] PDF container not found');
        return;
    }
    console.log('[PDF] PDF container found, ready to load PDFs');
}

// Export functions to window object
window.loadPDF = loadPDF;
window.searchPDF = searchPDF;
window.clearSearchResults = clearSearchResults;
window.nextSearchResult = nextSearchResult;
window.prevSearchResult = prevSearchResult;
window.goToPage = goToPage;
window.setZoomLevel = setZoomLevel;
window.initPDF = initPDF;

// Export for module usage
export { 
    initPDF, 
    loadPDF, 
    setZoomLevel,
    searchPDF,
    clearSearchResults,
    nextSearchResult,
    prevSearchResult,
    goToPage
}; 