/**
 * pdf.js - Handles all PDF-related functionality
 */

// Global variables
let currentPage = 1;
let pdfDoc = null;
let totalPages = 0;
let renderedPages = new Set();
let searchResults = [];
let currentSearchResultIndex = -1;
let currentZoom = 1.0;

// Set up PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

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

// Load a PDF from a URL
function loadPDF(url) {
    console.log(`[PDF.js] Loading PDF from URL: ${url}`);
    
    try {
        // Show loading state
        const pdfViewer = document.getElementById('pdfViewer');
        if (pdfViewer) {
            pdfViewer.innerHTML = '<div class="pdf-loading"><i class="fas fa-spinner fa-spin"></i> Loading PDF...</div>';
        }
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(url);
        loadingTask.promise.then(function(pdf) {
            pdfDoc = pdf;
            totalPages = pdf.numPages;
            
            console.log(`[PDF.js] PDF loaded successfully with ${totalPages} pages`);
            
            // Clear the container
            const pdfContainer = document.getElementById('pdfContainer');
            if (pdfContainer) {
                pdfContainer.innerHTML = '';
            }
            
            // Render all pages
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                renderPage(pageNum);
            }
            
            // Hide loading state
            if (pdfViewer) {
                pdfViewer.innerHTML = '';
                pdfViewer.appendChild(pdfContainer);
            }
        }).catch(function(error) {
            console.error('[PDF.js] Error loading PDF:', error);
            throw error;
        });
        
        return true;
    } catch (error) {
        console.error('[PDF.js] Error loading PDF:', error);
        throw error;
    }
}

// Search for text in the PDF
function searchPDF(searchText) {
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
function initPDF() {
    console.log('[PDF.js] Initializing PDF functionality');
    
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