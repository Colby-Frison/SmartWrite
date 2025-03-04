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
    console.log('[PDF] renderAllPages() called');
    
    if (!pdfDoc) {
        console.error('[PDF] pdfDoc is null, cannot render pages');
        return;
    }
    
    const pagesContainer = document.getElementById('pdfPagesContainer');
    if (!pagesContainer) {
        console.error('[PDF] pdfPagesContainer not found, cannot render pages');
        return;
    }
    
    // Clear existing content
    console.log('[PDF] Clearing existing content in pagesContainer');
    pagesContainer.innerHTML = '';
    renderedPages.clear();
    
    console.log(`[PDF] About to render ${pdfDoc.numPages} pages`);
    
    // Create a fragment to append all pages at once
    const fragment = document.createDocumentFragment();
    
    // Function to render a specific page
    const renderPage = (pageNum) => {
        console.log(`[PDF] Starting to render page ${pageNum}`);
        
        pdfDoc.getPage(pageNum).then(function(page) {
            console.log(`[PDF] Got page ${pageNum} from PDF.js`);
            
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
            
            console.log(`[PDF] Canvas size set to ${canvas.width}x${canvas.height} for page ${pageNum}`);
            
            // Render the page content on the canvas
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            
            console.log(`[PDF] Calling page.render() for page ${pageNum}`);
            
            page.render(renderContext).promise.then(function() {
                console.log(`[PDF] Page ${pageNum} rendered successfully`);
                renderedPages.add(pageNum);
                
                // If this is the current page, scroll to it
                if (pageNum === currentPage) {
                    setTimeout(() => {
                        console.log(`[PDF] Scrolling to page ${pageNum}`);
                        pageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            }).catch(function(error) {
                console.error(`[PDF] Error rendering page ${pageNum}:`, error);
            });
            
            // Add the canvas to the page div
            pageDiv.appendChild(canvas);
            
            // Add page number indicator
            const pageNumberDiv = document.createElement('div');
            pageNumberDiv.className = 'page-number';
            pageNumberDiv.textContent = pageNum;
            pageDiv.appendChild(pageNumberDiv);
            
            // Add the page div to the fragment
            fragment.appendChild(pageDiv);
            console.log(`[PDF] Added page ${pageNum} div to document fragment`);
        }).catch(function(error) {
            console.error(`[PDF] Error getting page ${pageNum}:`, error);
        });
    };
    
    // Render all pages
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        renderPage(i);
    }
    
    // Append all pages to the container
    console.log('[PDF] Appending all pages to the container');
    pagesContainer.appendChild(fragment);
    
    // Update total pages
    totalPages = pdfDoc.numPages;
    console.log(`[PDF] Total pages set to ${totalPages}`);
    
    // Update page count display
    const pageCountElement = document.getElementById('pageCount');
    if (pageCountElement) {
        pageCountElement.textContent = totalPages;
    } else {
        console.error('[PDF] pageCount element not found');
    }
    
    // Update current page display
    const currentPageElement = document.getElementById('currentPage');
    if (currentPageElement) {
        currentPageElement.textContent = currentPage;
    } else {
        console.error('[PDF] currentPage element not found');
    }
    
    // Enable/disable navigation buttons
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    
    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage <= 1;
    } else {
        console.error('[PDF] prevPage button not found');
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = currentPage >= totalPages;
    } else {
        console.error('[PDF] nextPage button not found');
    }
    
    // Apply current zoom level
    console.log('[PDF] Applying current zoom level');
    setZoomLevel(getCurrentZoom());
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
    
    // Show loading indicator
    const pagesContainer = document.getElementById('pdfPagesContainer');
    if (pagesContainer) {
        console.log('[PDF] Found pdfPagesContainer, showing loading indicator');
        pagesContainer.innerHTML = '<div class="pdf-loading">Loading PDF...</div>';
    } else {
        console.error('[PDF] pdfPagesContainer not found in the DOM');
    }
    
    try {
        console.log('[PDF] Creating PDF.js loading task');
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
            }
        }).catch(function(error) {
            console.error('[PDF] Error in PDF.js promise:', error);
            
            // Show error message
            if (pagesContainer) {
                pagesContainer.innerHTML = `<div class="pdf-error">Error loading PDF: ${error.message}</div>`;
            }
        });
    } catch (error) {
        console.error('[PDF] Exception during PDF loading:', error);
        if (pagesContainer) {
            pagesContainer.innerHTML = `<div class="pdf-error">Error loading PDF: ${error.message}</div>`;
        }
    }
}

// Initialize PDF functionality
function initPDF() {
    console.log('[PDF] Initializing PDF functionality');
    
    // Set up navigation buttons
    const prevPageBtn = document.getElementById('prevPage');
    if (prevPageBtn) {
        console.log('[PDF] Adding click handler to prevPage button');
        prevPageBtn.addEventListener('click', prevPage);
    } else {
        console.error('[PDF] prevPage button not found');
    }
    
    const nextPageBtn = document.getElementById('nextPage');
    if (nextPageBtn) {
        console.log('[PDF] Adding click handler to nextPage button');
        nextPageBtn.addEventListener('click', nextPage);
    } else {
        console.error('[PDF] nextPage button not found');
    }
    
    // Set up zoom buttons
    const zoomInBtn = document.getElementById('zoomIn');
    if (zoomInBtn) {
        console.log('[PDF] Adding click handler to zoomIn button');
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
        console.log('[PDF] Adding click handler to zoomOut button');
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
        console.log('[PDF] Adding click handler to zoomReset button');
        zoomResetBtn.addEventListener('click', function() {
            setZoomLevel(1.0);
        });
    } else {
        console.error('[PDF] zoomReset button not found');
    }
}

export { initPDF, loadPDF, setZoomLevel, prevPage, nextPage, goToPage }; 