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

// Set zoom level for PDF
function setZoomLevel(zoom) {
    setCurrentZoom(zoom);
    
    // Update zoom level display
    const zoomLevelElement = document.getElementById('zoomLevel');
    if (zoomLevelElement) {
        zoomLevelElement.textContent = `${Math.round(zoom * 100)}%`;
        console.log(`[PDF] Updated zoom level display to ${Math.round(zoom * 100)}%`);
    } else {
        console.warn('[PDF] zoomLevel element not found');
    }
    
    // Apply zoom to all rendered pages
    const pagesContainer = document.getElementById('pdfPagesContainer');
    if (pagesContainer) {
        pagesContainer.style.transform = `scale(${zoom})`;
        pagesContainer.style.transformOrigin = 'top center';
        console.log(`[PDF] Applied zoom level ${zoom} to pages container`);
    } else {
        console.warn('[PDF] pdfPagesContainer element not found');
    }
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
        return Promise.reject(new Error('PDF container not found'));
    }
    
    // Clear existing content
    pdfPagesContainer.innerHTML = '';
    console.log('[PDF] Cleared existing content');
    
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
            
            // Create a canvas for this page
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // Calculate viewport dimensions
            const viewport = page.getViewport({ scale: 1.0 });
            console.log(`[PDF] Viewport size for page ${pageNum}: ${viewport.width}x${viewport.height}`);
            
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
        console.log('[PDF] All pages added to container');
        
        // Mark current page
        const currentPageDiv = pdfPagesContainer.querySelector(`.pdf-page[data-page-number="${currentPage}"]`);
        if (currentPageDiv) {
            currentPageDiv.classList.add('current-page');
            
            // Scroll to current page if needed
            if (currentPage > 1) {
                currentPageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        
        // Update total page count
        totalPages = pdfDoc.numPages;
        const pageCountElement = document.getElementById('pageCount');
        if (pageCountElement) {
            pageCountElement.textContent = totalPages;
            console.log(`[PDF] Updated total page count to ${totalPages}`);
        } else {
            console.warn('[PDF] pageCount element not found');
        }
        
        // Update current page display
        const currentPageElement = document.getElementById('currentPage');
        if (currentPageElement) {
            currentPageElement.textContent = currentPage;
            console.log(`[PDF] Updated current page display to ${currentPage}`);
        } else {
            console.warn('[PDF] currentPage element not found');
        }
            
            // Enable/disable navigation buttons
        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');
        
        if (prevPageBtn) {
            prevPageBtn.disabled = currentPage <= 1;
            console.log(`[PDF] prevPage button ${prevPageBtn.disabled ? 'disabled' : 'enabled'}`);
        } else {
            console.warn('[PDF] prevPage button not found');
        }
        
        if (nextPageBtn) {
            nextPageBtn.disabled = currentPage >= totalPages;
            console.log(`[PDF] nextPage button ${nextPageBtn.disabled ? 'disabled' : 'enabled'}`);
        } else {
            console.warn('[PDF] nextPage button not found');
        }
        
        // Apply current zoom level
        console.log('[PDF] Applying current zoom level');
        setZoomLevel(getCurrentZoom());
        
        return pageDivs;
    });
}

// Go to a specific page
function goToPage(pageNum) {
    console.log(`[PDF] goToPage called with pageNum: ${pageNum}`);
    
    if (!pdfDoc) {
        console.error('[PDF] No PDF document loaded');
        return;
    }
    
    if (pageNum < 1 || pageNum > totalPages) {
        console.error(`[PDF] Invalid page number: ${pageNum}, total pages: ${totalPages}`);
        return;
    }
    
    console.log(`[PDF] Going to page ${pageNum} of ${totalPages}`);
    
    // Remove current page indicator from previous page
    const allPageDivs = document.querySelectorAll('.pdf-page');
    allPageDivs.forEach(div => {
        div.classList.remove('current-page');
    });
    
    // Update current page variable
    currentPage = pageNum;
    console.log(`[PDF] Current page variable updated to: ${currentPage}`);
    
    // Try to use the direct function first
    try {
        if (typeof updatePageCounter === 'function') {
            const result = updatePageCounter(currentPage);
            console.log(`[PDF] Called updatePageCounter directly with result: ${result}`);
        } else {
            console.warn('[PDF] updatePageCounter function not available');
            
            // Fall back to updating the element directly
            const currentPageElement = document.getElementById('currentPage');
            if (currentPageElement) {
                currentPageElement.textContent = String(currentPage);
                console.log(`[PDF] Updated current page display to ${currentPage}`);
            } else {
                console.warn('[PDF] currentPage element not found');
            }
        }
    } catch (error) {
        console.error('[PDF] Error updating page counter:', error);
        
        // Fall back to updating the element directly
        const currentPageElement = document.getElementById('currentPage');
        if (currentPageElement) {
            currentPageElement.textContent = String(currentPage);
            console.log(`[PDF] Updated current page display to ${currentPage}`);
        } else {
            console.warn('[PDF] currentPage element not found');
        }
    }
    
    // Enable/disable navigation buttons
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    
    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage <= 1;
        console.log(`[PDF] prevPage button ${prevPageBtn.disabled ? 'disabled' : 'enabled'}`);
    } else {
        console.warn('[PDF] prevPage button not found');
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = currentPage >= totalPages;
        console.log(`[PDF] nextPage button ${nextPageBtn.disabled ? 'disabled' : 'enabled'}`);
    } else {
        console.warn('[PDF] nextPage button not found');
    }
    
    // Scroll to the page and add current page indicator
    const pageDiv = document.querySelector(`.pdf-page[data-page-number="${pageNum}"]`);
    if (pageDiv) {
        pageDiv.classList.add('current-page');
        pageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log(`[PDF] Scrolled to page ${pageNum}`);
    } else {
        console.warn(`[PDF] Page div for page ${pageNum} not found`);
    }
}

// Go to the previous page
function prevPage() {
    console.log('[PDF] prevPage called, current page:', currentPage);
    if (currentPage <= 1) {
        console.log('[PDF] Already at first page, not navigating');
        return;
    }
    console.log('[PDF] Navigating to previous page:', currentPage - 1);
    goToPage(currentPage - 1);
}

// Go to the next page
function nextPage() {
    console.log('[PDF] nextPage called, current page:', currentPage, 'total pages:', totalPages);
    if (!pdfDoc || currentPage >= totalPages) {
        console.log('[PDF] Already at last page or no PDF loaded, not navigating');
        return;
    }
    console.log('[PDF] Navigating to next page:', currentPage + 1);
    goToPage(currentPage + 1);
}

// Load a PDF from a URL
function loadPDF(url) {
    console.log(`[PDF] Attempting to load PDF from URL: ${url}`);
    
    if (!url) {
        console.error('[PDF] Invalid URL provided');
        return Promise.reject(new Error('Invalid URL provided'));
    }
    
    // Show loading indicator
    const pdfPagesContainer = document.getElementById('pdfPagesContainer');
    if (pdfPagesContainer) {
        pdfPagesContainer.innerHTML = '<div class="pdf-loading"><i class="fas fa-spinner fa-spin"></i> Loading PDF...</div>';
    }
    
    // Create a loading task
    const loadingTask = pdfjsLib.getDocument(url);
    
    return loadingTask.promise.then(function(pdf) {
        console.log(`[PDF] PDF loaded successfully with ${pdf.numPages} pages`);
        
        // Store the PDF document
        pdfDoc = pdf;
        
        // Update state with current PDF
        setCurrentPDF(url);
        
        // Reset current page
        currentPage = 1;
        
        // Render all pages
        return renderAllPages().then(() => {
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
        
        // Hide PDF controls
        const pdfControls = document.querySelector('.pdf-controls');
        if (pdfControls) {
            pdfControls.style.display = 'none';
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
    
    // Set up navigation buttons
    const prevPageBtn = document.getElementById('prevPage');
    if (prevPageBtn) {
        console.log('[PDF] Found prevPage button:', prevPageBtn);
        
        // Test if the button is clickable
        prevPageBtn.onclick = function() {
            console.log('[PDF] prevPage button clicked directly via onclick');
        };
        
        // Remove any existing event listeners
        prevPageBtn.removeEventListener('click', prevPage);
        
        // Add new event listener
        prevPageBtn.addEventListener('click', function(e) {
            console.log('[PDF] prevPage button clicked via event listener');
            prevPage();
        });
        
        console.log('[PDF] Added click event to prevPage button');
    } else {
        console.error('[PDF] prevPage button not found');
    }
    
    const nextPageBtn = document.getElementById('nextPage');
    if (nextPageBtn) {
        console.log('[PDF] Found nextPage button:', nextPageBtn);
        
        // Test if the button is clickable
        nextPageBtn.onclick = function() {
            console.log('[PDF] nextPage button clicked directly via onclick');
        };
        
        // Remove any existing event listeners
        nextPageBtn.removeEventListener('click', nextPage);
        
        // Add new event listener
        nextPageBtn.addEventListener('click', function(e) {
            console.log('[PDF] nextPage button clicked via event listener');
            nextPage();
        });
        
        console.log('[PDF] Added click event to nextPage button');
    } else {
        console.error('[PDF] nextPage button not found');
    }
    
    // Set up zoom buttons
    const zoomInBtn = document.getElementById('zoomIn');
    if (zoomInBtn) {
        console.log('[PDF] Adding click event to zoomIn button');
        zoomInBtn.addEventListener('click', function() {
            let currentZoom = getCurrentZoom();
            currentZoom += 0.25;
            if (currentZoom > 3) currentZoom = 3;
            setZoomLevel(currentZoom);
        });
    } else {
        console.error('[PDF] zoomIn button not found');
    }
    
    const zoomOutBtn = document.getElementById('zoomOut');
    if (zoomOutBtn) {
        console.log('[PDF] Adding click event to zoomOut button');
        zoomOutBtn.addEventListener('click', function() {
            let currentZoom = getCurrentZoom();
            currentZoom -= 0.25;
            if (currentZoom < 0.5) currentZoom = 0.5;
            setZoomLevel(currentZoom);
        });
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

// Test function to update the page counter directly
function testPageCounter(pageNum) {
    console.log(`[PDF] testPageCounter called with pageNum: ${pageNum}`);
    
    // Update current page variable
    currentPage = pageNum;
    
    // Update current page display
    const currentPageElement = document.getElementById('currentPage');
    if (currentPageElement) {
        currentPageElement.textContent = String(pageNum);
        console.log(`[PDF] Updated current page display to ${pageNum}`);
        return true;
    } else {
        console.warn('[PDF] currentPage element not found');
        return false;
    }
}

export { 
    initPDF, 
    loadPDF, 
    setZoomLevel, 
    prevPage, 
    nextPage, 
    goToPage, 
    testPageCounter,
    searchPDF,
    clearSearchResults,
    nextSearchResult,
    prevSearchResult
}; 

// Export functions to window object for direct access
window.loadPDF = loadPDF;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.goToPage = goToPage;
window.searchPDF = searchPDF;
window.clearSearchResults = clearSearchResults;
window.nextSearchResult = nextSearchResult;
window.prevSearchResult = prevSearchResult; 