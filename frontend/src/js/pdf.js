/**
 * pdf.js - Handles all PDF-related functionality
 */

import { setCurrentPDF, getCurrentZoom, setCurrentZoom } from './state.js';

// Global variables
let currentPage = 1;
let pdfDoc = null;

// Set zoom level for PDF
function setZoomLevel(zoom) {
    setCurrentZoom(zoom);
    renderCurrentPage();
}

// Render a specific page of the PDF
function renderPage(pageNum) {
    if (!pdfDoc) return;
    
    pdfDoc.getPage(pageNum).then(function(page) {
        const pdfViewer = document.querySelector('.pdf-viewer');
        const canvas = document.getElementById('pdf-canvas');
        const ctx = canvas.getContext('2d');
        
        const viewport = page.getViewport({ scale: getCurrentZoom() });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Center the canvas
        if (pdfViewer) {
            setTimeout(() => {
                pdfViewer.scrollLeft = (pdfViewer.scrollWidth - pdfViewer.clientWidth) / 2;
            }, 100);
        }
        
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        page.render(renderContext).promise.then(function() {
            currentPage = pageNum;
            document.getElementById('currentPage').textContent = currentPage;
            
            // Enable/disable navigation buttons
            document.getElementById('prevPage').disabled = currentPage <= 1;
            document.getElementById('nextPage').disabled = currentPage >= pdfDoc.numPages;
        });
    });
}

// Render the current page
function renderCurrentPage() {
    renderPage(currentPage);
}

// Go to the previous page
function prevPage() {
    if (currentPage <= 1) return;
    renderPage(--currentPage);
}

// Go to the next page
function nextPage() {
    if (!pdfDoc || currentPage >= pdfDoc.numPages) return;
    renderPage(++currentPage);
}

// Load a PDF file
function loadPDF(url) {
    const loadingTask = pdfjsLib.getDocument(url);
    
    loadingTask.promise.then(function(pdf) {
        pdfDoc = pdf;
        
        // Update state with current PDF
        setCurrentPDF(url);
        
        // Update page count
        document.getElementById('pageCount').textContent = pdf.numPages;
        
        // Render the first page
        renderPage(1);
        
        // Show PDF controls
        document.querySelector('.pdf-controls').classList.remove('hidden');
    });
}

// Initialize PDF functionality
function initPDF() {
    // Set up PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
    
    // Set up navigation buttons
    document.getElementById('prevPage').addEventListener('click', prevPage);
    document.getElementById('nextPage').addEventListener('click', nextPage);
    
    // Set up zoom buttons
    document.getElementById('zoomIn').addEventListener('click', function() {
        let currentZoom = getCurrentZoom();
        currentZoom += 0.25;
        if (currentZoom > 3) currentZoom = 3;
        setZoomLevel(currentZoom);
    });
    
    document.getElementById('zoomOut').addEventListener('click', function() {
        let currentZoom = getCurrentZoom();
        currentZoom -= 0.25;
        if (currentZoom < 0.5) currentZoom = 0.5;
        setZoomLevel(currentZoom);
    });
    
    document.getElementById('zoomReset').addEventListener('click', function() {
        setZoomLevel(1.0);
    });
    
    // Load default PDF if available
    const defaultPDF = 'assets/sample.pdf';
    loadPDF(defaultPDF);
}

export { initPDF, loadPDF, setZoomLevel, prevPage, nextPage }; 