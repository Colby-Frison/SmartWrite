/**
 * pdf.js - Handles all PDF-related functionality
 */

import { setCurrentPDF, getCurrentZoom, setCurrentZoom } from './state.js';

// Global variables
let currentPage = 1;
let pdfDoc = null;
let totalPages = 0;
let renderedPages = new Set();

// Set zoom level for PDF
function setZoomLevel(zoom) {
    setCurrentZoom(zoom);
    
    // Update zoom level display
    const zoomLevelElement = document.getElementById('zoomLevel');
    if (zoomLevelElement) {
        zoomLevelElement.textContent = `${Math.round(zoom * 100)}%`;
    }
    
    // Apply zoom to all rendered pages
    const pagesContainer = document.getElementById('pdfPagesContainer');
    if (pagesContainer) {
        pagesContainer.style.transform = `scale(${zoom})`;
        pagesContainer.style.transformOrigin = 'top center';
    }
}

// Render all pages of the PDF
function renderAllPages() {
    console.log('[PDF] renderAllPages called');
    
    if (!pdfDoc) {
        console.error('[PDF] No PDF document loaded');
        return;
    }
    
    const pagesContainer = document.getElementById('pdfPagesContainer');
    if (!pagesContainer) {
        console.error('[PDF] pdfPagesContainer not found in the DOM');
        return;
    }
    
    console.log('[PDF] Clearing existing content and rendered pages');
    // Clear existing content
    pagesContainer.innerHTML = '';
    renderedPages.clear();
    
    // Create a fragment to append all pages at once
    const fragment = document.createDocumentFragment();
    console.log(`[PDF] Creating document fragment for ${pdfDoc.numPages} pages`);
    
    // Function to render a specific page
    const renderPage = (pageNum) => {
        console.log(`[PDF] Starting to render page ${pageNum}`);
        
        return pdfDoc.getPage(pageNum).then(function(page) {
            console.log(`[PDF] Got page ${pageNum} from PDF document`);
            
            // Create a div for this page
            const pageDiv = document.createElement('div');
            pageDiv.className = 'pdf-page';
            pageDiv.dataset.pageNumber = pageNum;
            
            // Create a canvas for this page
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set viewport based on zoom level
            const viewport = page.getViewport({ scale: 1.0 }); // Base scale is 1.0, we'll use CSS transform for zoom
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            console.log(`[PDF] Page ${pageNum} viewport size: ${viewport.width}x${viewport.height}`);
            
            // Render the page content on the canvas
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            
            console.log(`[PDF] Rendering page ${pageNum} to canvas`);
            return page.render(renderContext).promise.then(function() {
                console.log(`[PDF] Page ${pageNum} rendered successfully`);
                renderedPages.add(pageNum);
                
                // Add the canvas to the page div
                pageDiv.appendChild(canvas);
                
                // Add page number indicator
                const pageNumberDiv = document.createElement('div');
                pageNumberDiv.className = 'page-number';
                pageNumberDiv.textContent = pageNum;
                pageDiv.appendChild(pageNumberDiv);
                
                // If this is the current page, mark it for scrolling later
                if (pageNum === currentPage) {
                    console.log(`[PDF] Marking current page ${pageNum} for scrolling`);
                    pageDiv.dataset.isCurrent = 'true';
                }
                
                return pageDiv;
            }).catch(function(error) {
                console.error(`[PDF] Error rendering page ${pageNum}:`, error);
                throw error;
            });
        }).catch(function(error) {
            console.error(`[PDF] Error getting page ${pageNum}:`, error);
            throw error;
        });
    };
    
    // Create an array of promises for all pages
    console.log(`[PDF] Creating render promises for ${pdfDoc.numPages} pages`);
    const renderPromises = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        renderPromises.push(renderPage(i));
    }
    
    // Wait for all pages to be rendered
    Promise.all(renderPromises).then(pageDivs => {
        console.log(`[PDF] All ${pageDivs.length} pages rendered successfully`);
        
        // Add all page divs to the fragment
        pageDivs.forEach(pageDiv => {
            fragment.appendChild(pageDiv);
        });
        
        // Append all pages to the container
        console.log('[PDF] Appending all pages to container');
        pagesContainer.appendChild(fragment);
        
        // Scroll to current page if needed
        setTimeout(() => {
            const currentPageDiv = pagesContainer.querySelector('.pdf-page[data-is-current="true"]');
            if (currentPageDiv) {
                console.log(`[PDF] Scrolling to current page ${currentPage}`);
                currentPageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
        
        // Update total pages
        totalPages = pdfDoc.numPages;
        console.log(`[PDF] Total pages set to ${totalPages}`);
        
        // Update page count display
        const pageCountElement = document.getElementById('pageCount');
        if (pageCountElement) {
            pageCountElement.textContent = totalPages;
            console.log(`[PDF] Updated page count display to ${totalPages}`);
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
    }).catch(function(error) {
        console.error('[PDF] Error in renderAllPages:', error);
        pagesContainer.innerHTML = `<div class="pdf-error">Error rendering PDF: ${error.message}</div>`;
    });
}

// Go to a specific page
function goToPage(pageNum) {
    if (!pdfDoc || pageNum < 1 || pageNum > totalPages) return;
    
    currentPage = pageNum;
    
    // Update current page display
    const currentPageElement = document.getElementById('currentPage');
    if (currentPageElement) {
        currentPageElement.textContent = currentPage;
    }
    
    // Enable/disable navigation buttons
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
    
    // Scroll to the page
    const pageDiv = document.querySelector(`.pdf-page[data-page-number="${pageNum}"]`);
    if (pageDiv) {
        pageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Go to the previous page
function prevPage() {
    if (currentPage <= 1) return;
    goToPage(currentPage - 1);
}

// Go to the next page
function nextPage() {
    if (!pdfDoc || currentPage >= totalPages) return;
    goToPage(currentPage + 1);
}

// Load a PDF file
function loadPDF(url) {
    console.log(`[PDF] Attempting to load PDF from URL: ${url}`);
    
    try {
        // Show loading indicator
        const pagesContainer = document.getElementById('pdfPagesContainer');
        if (pagesContainer) {
            console.log('[PDF] Found pdfPagesContainer, showing loading indicator');
            pagesContainer.innerHTML = '<div class="pdf-loading">Loading PDF...</div>';
        } else {
            console.error('[PDF] pdfPagesContainer not found in the DOM');
        }
        
        // Check if URL is valid
        if (!url || url === '#') {
            console.error('[PDF] Invalid URL provided:', url);
            if (pagesContainer) {
                pagesContainer.innerHTML = `<div class="pdf-error">Error: Invalid PDF URL provided</div>`;
            }
            return;
        }
        
        console.log('[PDF] Creating PDF.js loading task for URL:', url);
        const loadingTask = pdfjsLib.getDocument(url);
        
        loadingTask.promise.then(function(pdf) {
            console.log(`[PDF] PDF loaded successfully with ${pdf.numPages} pages`);
            pdfDoc = pdf;
            
            // Update state with current PDF
            setCurrentPDF(url);
            
            // Reset current page
            currentPage = 1;
            
            // Render all pages
            console.log('[PDF] Calling renderAllPages()');
            renderAllPages();
            
            // Show PDF controls
            const pdfControls = document.querySelector('.pdf-controls');
            if (pdfControls) {
                pdfControls.classList.remove('hidden');
                console.log('[PDF] PDF controls displayed');
            } else {
                console.warn('[PDF] PDF controls element not found');
            }
        }).catch(function(error) {
            console.error('[PDF] Error loading PDF:', error);
            
            // Show error message
            if (pagesContainer) {
                pagesContainer.innerHTML = `<div class="pdf-error">Error loading PDF: ${error.message}</div>`;
            }
        });
    } catch (error) {
        console.error('[PDF] Exception in loadPDF function:', error);
        const pagesContainer = document.getElementById('pdfPagesContainer');
        if (pagesContainer) {
            pagesContainer.innerHTML = `<div class="pdf-error">Error: ${error.message}</div>`;
        }
    }
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
        console.log('[PDF] Adding click event to prevPage button');
        prevPageBtn.addEventListener('click', prevPage);
    } else {
        console.error('[PDF] prevPage button not found');
    }
    
    const nextPageBtn = document.getElementById('nextPage');
    if (nextPageBtn) {
        console.log('[PDF] Adding click event to nextPage button');
        nextPageBtn.addEventListener('click', nextPage);
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
    
    const zoomResetBtn = document.getElementById('zoomReset');
    if (zoomResetBtn) {
        console.log('[PDF] Adding click event to zoomReset button');
        zoomResetBtn.addEventListener('click', function() {
            setZoomLevel(1.0);
        });
    } else {
        console.error('[PDF] zoomReset button not found');
    }
    
    console.log('[PDF] PDF viewer initialization complete');
}

export { initPDF, loadPDF, setZoomLevel, prevPage, nextPage, goToPage }; 

// Export functions to window object for direct access
window.loadPDF = loadPDF;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.goToPage = goToPage; 