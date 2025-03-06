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
    
    // Apply zoom to all pages
    const canvases = document.querySelectorAll('.pdf-page canvas');
    canvases.forEach(canvas => {
        const pageNum = parseInt(canvas.parentElement.dataset.pageNumber);
        if (pdfDoc) {
            pdfDoc.getPage(pageNum).then(page => {
                const viewport = page.getViewport({ scale: zoom });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
                const renderContext = {
                    canvasContext: canvas.getContext('2d'),
                    viewport: viewport
                };
                
                page.render(renderContext);
            });
        }
    });
}

// Render all pages of the PDF
function renderAllPages() {
    console.log('[PDF] renderAllPages called');
    
    if (!pdfDoc) {
        console.error('[PDF] No PDF document loaded');
        return Promise.reject(new Error('No PDF document loaded'));
    }
    
    const pdfPagesContainer = document.getElementById('pdfPagesContainer');
    if (!pdfPagesContainer) {
        console.error('[PDF] pdfPagesContainer not found in the DOM');
        return Promise.reject(new Error('pdfPagesContainer not found in the DOM'));
    }
    
    // Store total pages
    totalPages = pdfDoc.numPages;
    console.log(`[PDF] Total pages: ${totalPages}`);
    
    // Clear existing content (but keep any loading indicators)
    const loadingIndicator = pdfPagesContainer.querySelector('.pdf-loading');
    pdfPagesContainer.innerHTML = '';
    
    // If we had a loading indicator, add it back
    if (loadingIndicator) {
        pdfPagesContainer.appendChild(loadingIndicator);
    }
    
    // Create a document fragment to hold all pages
    const fragment = document.createDocumentFragment();
    
    // Function to render a single page
    function renderPage(pageNum) {
        console.log(`[PDF] Starting to render page ${pageNum}`);
        return pdfDoc.getPage(pageNum).then(function(page) {
            // Create a div for this page
            const pageDiv = document.createElement('div');
            pageDiv.className = 'pdf-page';
            pageDiv.setAttribute('data-page-number', pageNum);
            pageDiv.style.position = 'relative'; // Ensure proper positioning for skeleton
            
            // Calculate viewport dimensions
            const viewport = page.getViewport({ scale: 1.0 });
            console.log(`[PDF] Viewport size for page ${pageNum}: ${viewport.width}x${viewport.height}`);
            
            // Add skeleton loader for this page with correct dimensions
            const skeletonDiv = document.createElement('div');
            skeletonDiv.className = 'pdf-page-skeleton';
            skeletonDiv.style.width = `${viewport.width}px`;
            skeletonDiv.style.height = `${viewport.height}px`;
            
            // Add shimmer effect to the skeleton
            const shimmerContainer = document.createElement('div');
            shimmerContainer.className = 'pdf-skeleton-shimmer';
            skeletonDiv.appendChild(shimmerContainer);
            
            pageDiv.appendChild(skeletonDiv);
            
            // Create a canvas for this page
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // Set canvas dimensions
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Render the page
        const renderContext = {
                canvasContext: context,
            viewport: viewport
        };
        
            return page.render(renderContext).promise.then(function() {
                console.log(`[PDF] Page ${pageNum} rendered successfully`);
                
                // Add the canvas to the page div
                pageDiv.appendChild(canvas);
                
                // Remove the skeleton loader once the page is rendered
                setTimeout(() => {
                    skeletonDiv.classList.add('loaded');
                }, 100); // Small delay to ensure smooth transition
                
                return pageDiv;
            });
        });
    }
    
    // Create an array of promises for all pages
    const renderPromises = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        renderPromises.push(renderPage(i));
    }
    
    // Wait for all pages to be rendered
    return Promise.all(renderPromises).then(pageDivs => {
        console.log(`[PDF] All ${pageDivs.length} pages rendered successfully`);
        
        // Add all page divs to the fragment
        pageDivs.forEach(pageDiv => {
            fragment.appendChild(pageDiv);
        });
        
        // Append all pages to the container
        pdfPagesContainer.appendChild(fragment);
        
        // Mark the current page
        const currentPageDiv = pdfPagesContainer.querySelector(`.pdf-page[data-page-number="${currentPage}"]`);
        if (currentPageDiv) {
            currentPageDiv.classList.add('current-page');
            
            // Scroll to current page if it's not the first page
            if (currentPage > 1) {
                currentPageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        
        // Page counter updates have been removed
        
        // Apply current zoom level if not 100%
        if (currentZoom !== 1.0) {
            setZoomLevel(currentZoom);
        }
        
        return pageDivs;
    }).catch(error => {
        console.error('[PDF] Error rendering pages:', error);
        
        // Display error message
        pdfPagesContainer.innerHTML = `<div class="pdf-error"><i class="fas fa-exclamation-triangle"></i> Error rendering PDF: ${error.message}</div>`;
        
        return Promise.reject(error);
    });
}

// Load a PDF from a URL
function loadPDF(url) {
    console.log(`[PDF] Attempting to load PDF from URL: ${url}`);
    
    if (!url) {
        console.error('[PDF] Invalid URL provided');
        return Promise.reject(new Error('Invalid URL provided'));
    }
    
    // Get the PDF containers
    const pdfPagesContainer = document.getElementById('pdfPagesContainer');
    const pdfInitialSkeleton = document.getElementById('pdfInitialSkeleton');
    
    if (!pdfPagesContainer) {
        console.error('[PDF] pdfPagesContainer not found');
        return Promise.reject(new Error('pdfPagesContainer not found'));
    }
    
    // Make sure the initial skeleton is visible during loading
    if (pdfInitialSkeleton) {
        console.log('[PDF] Showing initial skeleton during loading');
        pdfInitialSkeleton.classList.remove('hidden');
    }
    
    // Clear existing content
    pdfPagesContainer.innerHTML = '';
    
    // Add loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'pdf-loading';
    loadingMessage.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading PDF...';
    pdfPagesContainer.appendChild(loadingMessage);
    
    // Create a loading task
    console.log(`[PDF] Starting to load PDF from URL: ${url}`);
    const loadingTask = pdfjsLib.getDocument(url);
    
    return loadingTask.promise.then(function(pdf) {
        console.log(`[PDF] PDF loaded successfully with ${pdf.numPages} pages`);
        
        // Store the PDF document
        pdfDoc = pdf;
        
        // Update state with current PDF
        setCurrentPDF(url);
        
        // Reset current page
        currentPage = 1;
        
        // Hide the initial skeleton as soon as the PDF is loaded
        if (pdfInitialSkeleton) {
            console.log('[PDF] Hiding initial skeleton after PDF load');
            pdfInitialSkeleton.classList.add('hidden');
        }
        
        // Render all pages
        return renderAllPages().then(() => {
            // Make absolutely sure the initial skeleton is hidden
            if (pdfInitialSkeleton) {
                console.log('[PDF] Ensuring initial skeleton is hidden after rendering');
                pdfInitialSkeleton.classList.add('hidden');
                // Force the skeleton to be hidden with inline style as well
                pdfInitialSkeleton.style.display = 'none';
            }
            
            // Show PDF controls
            const pdfControls = document.querySelector('.pdf-controls');
            if (pdfControls) {
                pdfControls.style.display = 'flex';
                console.log('[PDF] PDF controls displayed');
            } else {
                console.warn('[PDF] PDF controls element not found');
            }
            
            console.log('[PDF] PDF loaded and rendered successfully');
            return pdf;
        });
    }).catch(function(error) {
        console.error('[PDF] Error loading PDF:', error);
        
        // Display error message
        if (pdfPagesContainer) {
            pdfPagesContainer.innerHTML = `<div class="pdf-error"><i class="fas fa-exclamation-triangle"></i> Error loading PDF: ${error.message}</div>`;
        }
        
        return Promise.reject(error);
    });
}

// Search for text in the PDF
async function searchPDF(searchText) {
    console.log(`[PDF] Searching for text: "${searchText}"`);
    
    if (!pdfDoc) {
        console.error('[PDF] No PDF document loaded');
        return Promise.reject(new Error('No PDF document loaded'));
    }
    
    if (!searchText || searchText.trim() === '') {
        console.warn('[PDF] Empty search text');
        clearSearchResults();
        return Promise.resolve([]);
    }
    
    // Clear previous search results
    clearSearchResults();
    
    // Show loading indicator in search results count
    const searchResultsCount = document.getElementById('searchResultsCount');
    if (searchResultsCount) {
        searchResultsCount.textContent = 'Searching...';
    }
    
    // Disable search buttons during search
    const prevSearchBtn = document.getElementById('prevSearchResult');
    const nextSearchBtn = document.getElementById('nextSearchResult');
    if (prevSearchBtn) prevSearchBtn.disabled = true;
    if (nextSearchBtn) nextSearchBtn.disabled = true;
    
    try {
        // Array to store all search results
        const results = [];
        
        // Search each page
        for (let pageIndex = 1; pageIndex <= pdfDoc.numPages; pageIndex++) {
            const page = await pdfDoc.getPage(pageIndex);
            const textContent = await page.getTextContent();
            const viewport = page.getViewport({ scale: 1.0 });
            
            // Process text items
            for (let i = 0; i < textContent.items.length; i++) {
                const item = textContent.items[i];
                const text = item.str;
                
                // Check if the text contains the search term (case insensitive)
                const searchTermLower = searchText.toLowerCase();
                const textLower = text.toLowerCase();
                let index = textLower.indexOf(searchTermLower);
                
                while (index !== -1) {
                    // Calculate position of the match
                    const matchLength = searchText.length;
                    
                    // Transform text coordinates to viewport coordinates
                    const tx = pdfjsLib.Util.transform(
                        viewport.transform,
                        item.transform
                    );
                    
                    // Calculate the rectangle for this text item
                    const rect = {
                        left: tx[4],
                        top: tx[5] - item.height,
                        right: tx[4] + (item.width * (index + matchLength) / text.length),
                        bottom: tx[5],
                        pageIndex: pageIndex,
                        matchText: text.substr(index, matchLength)
                    };
                    
                    // Adjust left position for the specific match
                    rect.left += item.width * (index / text.length);
                    
                    // Store the result
                    results.push(rect);
                    
                    // Look for next occurrence
                    index = textLower.indexOf(searchTermLower, index + 1);
                }
            }
        }
        
        console.log(`[PDF] Search completed. Found ${results.length} results`);
        
        // Store search results
        searchResults = results;
        
        // Update search results count
        if (searchResultsCount) {
            searchResultsCount.textContent = results.length > 0 ? `1/${results.length}` : '0/0';
        }
        
        // Enable/disable search navigation buttons
        if (prevSearchBtn) prevSearchBtn.disabled = results.length <= 1;
        if (nextSearchBtn) nextSearchBtn.disabled = results.length <= 1;
        
        // Highlight search results
        if (results.length > 0) {
            highlightSearchResults();
            // Navigate to the first result
            currentSearchResultIndex = 0;
            navigateToSearchResult(0);
        }
        
        return results;
    } catch (error) {
        console.error('[PDF] Error searching PDF:', error);
        
        // Update search results count
        if (searchResultsCount) {
            searchResultsCount.textContent = 'Error';
        }
        
        return Promise.reject(error);
    }
}

// Clear search results
function clearSearchResults() {
    console.log('[PDF] Clearing search results');
    
    // Remove all highlight elements
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => highlight.remove());
    
    // Reset search results
    searchResults = [];
    currentSearchResultIndex = -1;
    
    // Update search results count
    const searchResultsCount = document.getElementById('searchResultsCount');
    if (searchResultsCount) {
        searchResultsCount.textContent = '0/0';
    }
    
    // Disable search navigation buttons
    const prevSearchBtn = document.getElementById('prevSearchResult');
    const nextSearchBtn = document.getElementById('nextSearchResult');
    if (prevSearchBtn) prevSearchBtn.disabled = true;
    if (nextSearchBtn) nextSearchBtn.disabled = true;
}

// Highlight search results
function highlightSearchResults() {
    console.log(`[PDF] Highlighting ${searchResults.length} search results`);
    
    // Get the PDF container
    const pdfPagesContainer = document.getElementById('pdfPagesContainer');
    if (!pdfPagesContainer) {
        console.error('[PDF] pdfPagesContainer not found');
        return;
    }
    
    // Create highlights for each result
    searchResults.forEach((result, index) => {
        // Find the page div
        const pageDiv = pdfPagesContainer.querySelector(`.pdf-page[data-page-number="${result.pageIndex}"]`);
        if (!pageDiv) {
            console.warn(`[PDF] Page div for page ${result.pageIndex} not found`);
            return;
        }
        
        // Create highlight element
        const highlight = document.createElement('div');
        highlight.className = 'search-highlight';
        highlight.dataset.resultIndex = index;
        
        // Position the highlight
        highlight.style.left = `${result.left}px`;
        highlight.style.top = `${result.top}px`;
        highlight.style.width = `${result.right - result.left}px`;
        highlight.style.height = `${result.bottom - result.top}px`;
        
        // Add click event to navigate to this result
        highlight.addEventListener('click', () => {
            navigateToSearchResult(index);
        });
        
        // Add highlight to the page
        pageDiv.appendChild(highlight);
    });
}

// Navigate to a specific search result
function navigateToSearchResult(resultIndex) {
    console.log(`[PDF] Navigating to search result ${resultIndex}`);
    
    if (resultIndex < 0 || resultIndex >= searchResults.length) {
        console.error(`[PDF] Invalid result index: ${resultIndex}`);
        return;
    }
    
    // Remove current highlight from previous result
    const currentHighlight = document.querySelector('.search-highlight.current');
    if (currentHighlight) {
        currentHighlight.classList.remove('current');
    }
    
    // Get the result
    const result = searchResults[resultIndex];
    
    // Update current result index
    currentSearchResultIndex = resultIndex;
    
    // Update search results count
    const searchResultsCount = document.getElementById('searchResultsCount');
    if (searchResultsCount) {
        searchResultsCount.textContent = `${resultIndex + 1}/${searchResults.length}`;
    }
    
    // Go to the page containing the result
    goToPage(result.pageIndex);
    
    // Add current class to the highlight
    const highlight = document.querySelector(`.search-highlight[data-result-index="${resultIndex}"]`);
    if (highlight) {
        highlight.classList.add('current');
        
        // Scroll to the highlight
        setTimeout(() => {
            highlight.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    }
}

// Navigate to the next search result
function nextSearchResult() {
    console.log('[PDF] Next search result');
    
    if (searchResults.length === 0) {
        console.warn('[PDF] No search results');
        return;
    }
    
    // Calculate next index (with wrap-around)
    const nextIndex = (currentSearchResultIndex + 1) % searchResults.length;
    navigateToSearchResult(nextIndex);
}

// Navigate to the previous search result
function prevSearchResult() {
    console.log('[PDF] Previous search result');
    
    if (searchResults.length === 0) {
        console.warn('[PDF] No search results');
        return;
    }
    
    // Calculate previous index (with wrap-around)
    const prevIndex = (currentSearchResultIndex - 1 + searchResults.length) % searchResults.length;
    navigateToSearchResult(prevIndex);
}

// Go to a specific page
function goToPage(pageNum) {
    console.log(`[PDF] goToPage called with pageNum: ${pageNum}`);
    
    if (!pdfDoc) {
        console.error('[PDF] No PDF document loaded');
        return;
    }
    
    if (pageNum < 1 || pageNum > totalPages) {
        console.error(`[PDF] Invalid page number: ${pageNum}`);
        return;
    }
    
    // Update current page
    currentPage = pageNum;
    
    // Remove current-page class from all pages
    const pdfPagesContainer = document.getElementById('pdfPagesContainer');
    if (pdfPagesContainer) {
        const allPages = pdfPagesContainer.querySelectorAll('.pdf-page');
        allPages.forEach(page => page.classList.remove('current-page'));
        
        // Add current-page class to the new current page
        const currentPageDiv = pdfPagesContainer.querySelector(`.pdf-page[data-page-number="${pageNum}"]`);
        if (currentPageDiv) {
            currentPageDiv.classList.add('current-page');
            
            // Scroll to the page
            currentPageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    console.log(`[PDF] Navigated to page ${pageNum}`);
}

// Initialize PDF functionality
function initPDF() {
    console.log('[PDF] initPDF function called');
    
    // Check if PDF.js is available
    if (typeof pdfjsLib === 'undefined') {
        console.error('[PDF] PDF.js library not loaded');
        return;
    } else {
        console.log('[PDF] PDF.js library detected, version:', pdfjsLib.version);
    }
    
    // Check if worker is set up correctly
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        console.warn('[PDF] PDF.js worker source not set');
    } else {
        console.log('[PDF] PDF.js worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    }
    
    // Ensure the initial skeleton is visible when no PDF is loaded
    const pdfInitialSkeleton = document.getElementById('pdfInitialSkeleton');
    const pdfPagesContainer = document.getElementById('pdfPagesContainer');
    
    if (pdfInitialSkeleton) {
        // Only show the skeleton if no PDF is loaded
        if (!pdfDoc && (!pdfPagesContainer || pdfPagesContainer.children.length === 0)) {
            pdfInitialSkeleton.classList.remove('hidden');
            console.log('[PDF] Initial skeleton displayed');
        } else {
            pdfInitialSkeleton.classList.add('hidden');
            console.log('[PDF] Initial skeleton hidden (PDF already loaded)');
        }
    }
    
    // Set up zoom buttons
    const zoomInBtn = document.getElementById('zoomIn');
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', function() {
            console.log('[PDF] Zoom in button clicked');
            setZoomLevel(currentZoom + 0.25);
        });
        console.log('[PDF] Zoom in button event listener added');
    } else {
        console.error('[PDF] Zoom in button not found');
    }
    
    const zoomOutBtn = document.getElementById('zoomOut');
    if (zoomOutBtn) {
        console.log('[PDF] Found zoomOut button:', zoomOutBtn);
        
        // Remove any existing event listeners
        zoomOutBtn.removeEventListener('click', function() {
            setZoomLevel(currentZoom - 0.25);
        });
        
        // Add new event listener
        zoomOutBtn.addEventListener('click', function() {
            console.log('[PDF] zoomOut button clicked');
            setZoomLevel(currentZoom - 0.25);
        });
        
        console.log('[PDF] Added click event to zoomOut button');
    } else {
        console.error('[PDF] zoomOut button not found');
    }
    
    // Set up search functionality
    const searchInput = document.getElementById('pdfSearchInput');
    const searchBtn = document.getElementById('pdfSearchBtn');
    const prevSearchBtn = document.getElementById('prevSearchResult');
    const nextSearchBtn = document.getElementById('nextSearchResult');
    
    if (searchInput) {
        console.log('[PDF] Adding keyup event to search input');
        searchInput.addEventListener('keyup', function(e) {
            // Search on Enter key
            if (e.key === 'Enter') {
                searchPDF(this.value);
            }
            
            // Clear results if input is empty
            if (this.value.trim() === '') {
                clearSearchResults();
            }
        });
    } else {
        console.error('[PDF] pdfSearchInput not found');
    }
    
    // Add keyboard shortcut (Ctrl+F) to focus search input
    document.addEventListener('keydown', function(e) {
        // Check if Ctrl+F is pressed
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            // Prevent default browser search
            e.preventDefault();
            
            // Focus the search input
            if (searchInput) {
                searchInput.focus();
                
                // If there's text in the input, select it
                if (searchInput.value.trim() !== '') {
                    searchInput.select();
                }
                
                console.log('[PDF] Search input focused via Ctrl+F');
            }
        }
    });
    
    if (searchBtn) {
        console.log('[PDF] Adding click event to search button');
        searchBtn.addEventListener('click', function() {
            const searchText = searchInput ? searchInput.value : '';
            searchPDF(searchText);
        });
    } else {
        console.error('[PDF] pdfSearchBtn not found');
    }
    
    if (prevSearchBtn) {
        console.log('[PDF] Adding click event to previous search result button');
        prevSearchBtn.addEventListener('click', prevSearchResult);
    } else {
        console.error('[PDF] prevSearchResult button not found');
    }
    
    if (nextSearchBtn) {
        console.log('[PDF] Adding click event to next search result button');
        nextSearchBtn.addEventListener('click', nextSearchResult);
    } else {
        console.error('[PDF] nextSearchResult button not found');
    }
    
    console.log('[PDF] PDF functionality initialized');
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

// Export functions to window object for direct access
window.loadPDF = loadPDF;
window.searchPDF = searchPDF;
window.clearSearchResults = clearSearchResults;
window.nextSearchResult = nextSearchResult;
window.prevSearchResult = prevSearchResult;
window.goToPage = goToPage; 