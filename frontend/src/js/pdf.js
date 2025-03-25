/**
 * pdf.js - Handles all PDF-related functionality
 */

import { setCurrentPDF, getCurrentZoom, setCurrentZoom } from './state.js';

// Global variables
let currentPage = 1;
let pdfDoc = null;
let totalPages = 0;
let renderedPages = new Set();
let searchResults = [];
let currentSearchResultIndex = -1;
let currentZoom = 1.0;

// Set zoom level
function setZoomLevel(zoom) {
    console.log(`[PDF] Setting zoom level to ${zoom}`);
    
    if (zoom < 0.25 || zoom > 3) {
        console.error(`[PDF] Invalid zoom level: ${zoom}`);
        return;
    }
    
    currentZoom = zoom;
    
    // Update zoom level display
    const zoomLevelElement = document.getElementById('zoomLevel');
    if (zoomLevelElement) {
        zoomLevelElement.textContent = `${Math.round(zoom * 100)}%`;
    }
    
    // Save zoom level to state
    setCurrentZoom(zoom);
}

// Render a single page
async function renderPage(pageNum) {
    console.log(`[PDF] Rendering page ${pageNum}`);
    
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: currentZoom });
    
    // Create page container
    const pageDiv = document.createElement('div');
    pageDiv.className = 'pdf-page';
    pageDiv.setAttribute('data-page-number', pageNum);
    
    // Create wrapper for canvas and text layer
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-page-wrapper';
    wrapper.style.width = `${viewport.width}px`;
    wrapper.style.height = `${viewport.height}px`;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Create text layer with proper positioning
    const textLayer = document.createElement('div');
    textLayer.className = 'textLayer';
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;
    
    // Add elements to wrapper
    wrapper.appendChild(canvas);
    wrapper.appendChild(textLayer);
    
    // Add wrapper to page
    pageDiv.appendChild(wrapper);
    
    // Render page content
    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    
    // Get text content
    const textContent = await page.getTextContent();
    
    // Render both canvas and text layer
    await Promise.all([
        page.render(renderContext).promise,
        pdfjsLib.renderTextLayer({
            textContent: textContent,
            container: textLayer,
            viewport: viewport,
            textDivs: [],
            enhanceTextSelection: true,
            textLayerMode: 2,
            renderInteractiveForms: true
        })
    ]);
    
    // Add text selection event listener
    textLayer.addEventListener('mouseup', function(e) {
        const selection = window.getSelection();
        if (selection.toString().length > 0) {
            const selectedText = selection.toString();
            console.log(`[PDF] Selected text: ${selectedText}`);
            // You can add custom handling for selected text here
        }
    });
    
    return pageDiv;
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
async function loadPDF(url) {
    console.log(`[PDF] Loading PDF from URL: ${url}`);
    
    if (!url) {
        console.error('[PDF] Invalid URL provided');
        return;
    }
    
    const pdfContainer = document.getElementById('pdfContainer');
    if (!pdfContainer) {
        console.error('[PDF] pdfContainer not found');
        return;
    }
    
    // Show loading message
    const pdfViewer = document.getElementById('pdfViewer');
    if (pdfViewer) {
        pdfViewer.innerHTML = '<div class="pdf-loading"><i class="fas fa-spinner fa-spin"></i> Loading PDF...</div>';
    }
    
    try {
        // Create object element for PDF
        const objectElement = document.createElement('object');
        objectElement.type = 'application/pdf';
        objectElement.data = url;
        objectElement.width = '100%';
        objectElement.height = '100%';
        
        // Create iframe fallback
        const iframeElement = document.createElement('iframe');
        iframeElement.src = url;
        iframeElement.width = '100%';
        iframeElement.height = '100%';
        iframeElement.style.display = 'none';
        
        // Clear container
        pdfContainer.innerHTML = '';
        
        // Add elements to container
        pdfContainer.appendChild(objectElement);
        pdfContainer.appendChild(iframeElement);
        
        // Hide initial skeleton if it exists
        const pdfInitialSkeleton = document.getElementById('pdfInitialSkeleton');
        if (pdfInitialSkeleton) {
            pdfInitialSkeleton.classList.add('hidden');
        }
        
        // Show PDF controls
        const pdfControls = document.querySelector('.pdf-controls');
        if (pdfControls) {
            pdfControls.style.display = 'flex';
        }
        
        // Update state
        setCurrentPDF(url);
        
        // Add event listener for PDF load
        objectElement.addEventListener('load', function() {
            console.log('[PDF] PDF loaded successfully');
            if (pdfViewer) {
                pdfViewer.innerHTML = '';
                pdfViewer.appendChild(pdfContainer);
            }
        });
        
        // Add event listener for PDF error
        objectElement.addEventListener('error', function(error) {
            console.error('[PDF] Error loading PDF:', error);
            // Show iframe fallback
            iframeElement.style.display = 'block';
            objectElement.style.display = 'none';
        });
        
    } catch (error) {
        console.error('[PDF] Error loading PDF:', error);
        if (pdfViewer) {
            pdfViewer.innerHTML = `<div class="pdf-error"><i class="fas fa-exclamation-triangle"></i> Error loading PDF: ${error.message}</div>`;
        }
    }
}

// Search for text in the PDF
async function searchPDF(searchText) {
    console.log(`[PDF] Searching for text: "${searchText}"`);
    
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
function initPDF() {
    console.log('[PDF] Initializing PDF functionality');
    
    // Set up zoom controls
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => setZoomLevel(currentZoom + 0.25));
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => setZoomLevel(currentZoom - 0.25));
    }
    
    // Set up search functionality
    const searchInput = document.getElementById('pdfSearchInput');
    const searchBtn = document.getElementById('pdfSearchBtn');
    
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                searchPDF(searchInput.value);
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (searchInput) searchPDF(searchInput.value);
        });
    }
    
    // Add keyboard shortcut for search
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                if (searchInput.value.trim() !== '') {
                    searchInput.select();
                }
            }
        }
    });
}

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

// Export functions to window object
window.loadPDF = loadPDF;
window.searchPDF = searchPDF;
window.clearSearchResults = clearSearchResults;
window.nextSearchResult = nextSearchResult;
window.prevSearchResult = prevSearchResult;
window.goToPage = goToPage; 