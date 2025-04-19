/**
 * pdf.js - Handles all PDF-related functionality
 */

// Use an IIFE to immediately export functions
(function() {
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

    // Helper function to render a single page and return its container
    async function renderPageToContainer(pageNum) {
        console.log(`[PDF.js] Rendering page ${pageNum}`);
        
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: currentZoom });
        
        // Create page container
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page';
        pageContainer.dataset.pageNumber = pageNum;
        pageContainer.style.width = `${viewport.width}px`;
        pageContainer.style.height = `${viewport.height}px`;
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Create text layer with proper positioning
        const textLayer = document.createElement('div');
        textLayer.className = 'textLayer';
        textLayer.style.width = `${viewport.width}px`;
        textLayer.style.height = `${viewport.height}px`;
        textLayer.style.left = '0';
        textLayer.style.top = '0';
        textLayer.style.position = 'absolute';
        
        // Create wrapper for canvas and text layer
        const wrapper = document.createElement('div');
        wrapper.className = 'pdf-page-wrapper';
        wrapper.style.width = `${viewport.width}px`;
        wrapper.style.height = `${viewport.height}px`;
        wrapper.style.position = 'relative';
        
        // Render page content with improved text rendering
        const renderContext = {
            canvasContext: context,
            viewport: viewport,
            textLayerMode: 2,
            renderInteractiveForms: true,
            enhanceTextSelection: true
        };
        
        await page.render(renderContext).promise;
        
        // Get text content with improved positioning
        const textContent = await page.getTextContent({
            normalizeWhitespace: true,
            disableCombineTextItems: false,
            includeMarkedContent: true
        });
        
        // Render text layer with improved alignment
        await pdfjsLib.renderTextLayer({
            textContent: textContent,
            container: textLayer,
            viewport: viewport,
            textDivs: [],
            enhanceTextSelection: true,
            textLayerMode: 2,
            renderInteractiveForms: true,
            useCanvasWidth: true
        }).promise;
        
        // Apply the text styling approach
        if (typeof window.adjustTextSpanStyles === 'function') {
            window.adjustTextSpanStyles(textLayer);
        } else if (typeof adjustTextSpanStyles === 'function') {
            adjustTextSpanStyles(textLayer);
        }
        
        // Add page number indicator
        const pageNumberDiv = document.createElement('div');
        pageNumberDiv.className = 'page-number';
        pageNumberDiv.textContent = `${pageNum}`;
        pageNumberDiv.title = `Page ${pageNum} of ${totalPages}`;
        pageNumberDiv.onclick = () => goToPage(pageNum);
        
        // Add elements to page container
        wrapper.appendChild(canvas);
        wrapper.appendChild(textLayer);
        pageContainer.appendChild(wrapper);
        pageContainer.appendChild(pageNumberDiv);
        
        console.log(`[PDF.js] Page ${pageNum} rendered successfully`);
        return pageContainer;
    }

    // Function to adjust text span styles to match search highlighting
    function adjustTextSpanStyles(textLayer) {
        const textSpans = textLayer.querySelectorAll('span');
        console.log(`[PDF.js] Adjusting ${textSpans.length} text spans in text layer`);
        
        // Group text spans by their vertical position to identify lines
        const lineGroups = {};
        const tolerance = 2; // Pixels of tolerance for considering elements on the same line
        
        textSpans.forEach(span => {
            const rect = span.getBoundingClientRect();
            const top = Math.round(rect.top);
            
            // Find the closest line group
            let foundGroup = false;
            for (const lineY in lineGroups) {
                if (Math.abs(top - parseInt(lineY)) <= tolerance) {
                    lineGroups[lineY].push(span);
                    foundGroup = true;
                    break;
                }
            }
            
            // Create a new line group if not found
            if (!foundGroup) {
                lineGroups[top] = [span];
            }
        });
        
        // Process each line group
        Object.values(lineGroups).forEach(lineElements => {
            // Sort elements by their left position
            lineElements.sort((a, b) => {
                return a.getBoundingClientRect().left - b.getBoundingClientRect().left;
            });
            
            // Apply styling to each element in the line
            lineElements.forEach(span => {
                // Preserve original positioning
                const originalStyle = span.getAttribute('style') || '';
                
                // Extract positioning styles
                const leftMatch = originalStyle.match(/left:\s*([^;]+)/);
                const topMatch = originalStyle.match(/top:\s*([^;]+)/);
                const fontSizeMatch = originalStyle.match(/font-size:\s*([^;]+)/);
                const fontFamilyMatch = originalStyle.match(/font-family:\s*([^;]+)/);
                
                // Create a new style string preserving original positioning
                let newStyle = '';
                
                if (leftMatch) newStyle += `left: ${leftMatch[1]}; `;
                if (topMatch) newStyle += `top: ${topMatch[1]}; `;
                if (fontSizeMatch) newStyle += `font-size: ${fontSizeMatch[1]}; `;
                if (fontFamilyMatch) newStyle += `font-family: ${fontFamilyMatch[1]}; `;
                
                // Add the exact scale transform from the image
                newStyle += 'transform: scaleX(0.7); transform-origin: 0% 0%;';
                
                // Apply the new style
                span.setAttribute('style', newStyle);
                span.setAttribute('role', 'presentation');
            });
        });
        
        console.log(`[PDF.js] Adjusted text spans across ${Object.keys(lineGroups).length} lines`);
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
            // We'll reuse the same loadPDF process but with the current document
            const pdfContainer = document.getElementById('pdfContainer');
            if (pdfContainer) {
                pdfContainer.innerHTML = '<div class="pdf-loading"><i class="fas fa-spinner fa-spin"></i> Resizing PDF...</div>';
                
                // Use setTimeout to ensure the loading message is displayed
                setTimeout(async () => {
                    try {
                        const fragment = document.createDocumentFragment();
                        
                        // Render pages sequentially in correct order
                        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                            try {
                                const pageContainer = await renderPageToContainer(pageNum);
                                if (pageContainer) {
                                    fragment.appendChild(pageContainer);
                                }
                            } catch (error) {
                                console.error(`[PDF.js] Error re-rendering page ${pageNum} at zoom level ${zoom}:`, error);
                                // Create an error placeholder for this page
                                const errorContainer = document.createElement('div');
                                errorContainer.className = 'pdf-page pdf-page-error';
                                errorContainer.dataset.pageNumber = pageNum;
                                errorContainer.innerHTML = `<div class="pdf-error">Error loading page ${pageNum}</div>`;
                                fragment.appendChild(errorContainer);
                            }
                        }
                        
                        // Replace content with all rendered pages
                        pdfContainer.innerHTML = '';
                        pdfContainer.appendChild(fragment);
                        
                        console.log('[PDF.js] All pages re-rendered at new zoom level');
                    } catch (error) {
                        console.error('[PDF.js] Error re-rendering PDF:', error);
                        pdfContainer.innerHTML = `<div class="pdf-error">Error resizing PDF: ${error.message}</div>`;
                    }
                }, 50); // Small delay to allow UI to update
            }
        }
    }

    // Load a PDF from a URL
    function loadPDF(url) {
        console.log(`[PDF.js] Loading PDF from URL: ${url}`);
        
        try {
            // Show loading state
            const pdfViewer = document.querySelector('.pdf-viewer');
            if (pdfViewer) {
                pdfViewer.innerHTML = '<div class="pdf-loading"><i class="fas fa-spinner fa-spin"></i> Loading PDF...</div>';
            }
            
            // Ensure pdfPagesContainer is visible and has active class
            const pdfPagesContainer = document.getElementById('pdfPagesContainer');
            if (pdfPagesContainer) {
                pdfPagesContainer.classList.add('active');
            }
            
            // Create pdfContainer if it doesn't exist
            let pdfContainer = document.getElementById('pdfContainer');
            if (!pdfContainer) {
                pdfContainer = document.createElement('div');
                pdfContainer.id = 'pdfContainer';
                pdfContainer.className = 'pdf-container';
                if (pdfViewer) {
                    pdfViewer.appendChild(pdfContainer);
                }
            }
            
            // Load the PDF document
            const loadingTask = pdfjsLib.getDocument(url);
            loadingTask.promise.then(async function(pdf) {
                pdfDoc = pdf;
                totalPages = pdf.numPages;
                
                console.log(`[PDF.js] PDF loaded successfully with ${totalPages} pages`);
                
                // Clear the container
                if (pdfContainer) {
                    pdfContainer.innerHTML = '';
                    
                    // Create a DocumentFragment to batch DOM operations
                    const fragment = document.createDocumentFragment();
                    
                    // Render pages sequentially in correct order
                    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                        try {
                            const pageContainer = await renderPageToContainer(pageNum);
                            if (pageContainer) {
                                fragment.appendChild(pageContainer);
                            }
                        } catch (error) {
                            console.error(`[PDF.js] Error rendering page ${pageNum}:`, error);
                            // Create an error placeholder for this page
                            const errorContainer = document.createElement('div');
                            errorContainer.className = 'pdf-page pdf-page-error';
                            errorContainer.dataset.pageNumber = pageNum;
                            errorContainer.innerHTML = `<div class="pdf-error">Error loading page ${pageNum}</div>`;
                            fragment.appendChild(errorContainer);
                        }
                    }
                    
                    // Add all rendered pages to the container at once
                    pdfContainer.appendChild(fragment);
                    
                    console.log('[PDF.js] All pages added to container in correct order');
                    
                    // Hide loading state
                    if (pdfViewer) {
                        pdfViewer.innerHTML = '';
                        pdfViewer.appendChild(pdfContainer);
                    }
                }
                
                return true;
            }).catch(function(error) {
                console.error('[PDF.js] Error loading PDF:', error);
                // Show error to user
                const pdfContainer = document.getElementById('pdfContainer');
                if (pdfContainer) {
                    pdfContainer.innerHTML = `<div class="pdf-error">Error loading PDF: ${error.message}</div>`;
                }
                return false;
            });
            
            return true;
        } catch (error) {
            console.error('[PDF.js] Error loading PDF:', error);
            return false;
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

    // Export all functions to the global scope
    window.loadPDF = loadPDF;
    window.searchPDF = searchPDF;
    window.clearSearchResults = clearSearchResults;
    window.nextSearchResult = nextSearchResult;
    window.prevSearchResult = prevSearchResult;
    window.goToPage = goToPage;
    window.setZoomLevel = setZoomLevel;
    window.initPDF = initPDF;
    window.adjustTextSpanStyles = adjustTextSpanStyles;
    window.renderPageToContainer = renderPageToContainer;
    
    console.log('[PDF.js] Module functions exported to global scope:', 
        ['loadPDF', 'searchPDF', 'clearSearchResults', 'nextSearchResult', 
        'prevSearchResult', 'goToPage', 'setZoomLevel', 'initPDF', 
        'adjustTextSpanStyles', 'renderPageToContainer'].join(', '));

    // To ensure ES module compatibility
    const exportedFunctions = {
        initPDF, 
        loadPDF, 
        setZoomLevel,
        searchPDF,
        clearSearchResults,
        nextSearchResult,
        prevSearchResult,
        goToPage,
        adjustTextSpanStyles,
        renderPageToContainer
    };
    
    // Handle module export if supported
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportedFunctions;
    } else if (typeof exports !== 'undefined') {
        Object.assign(exports, exportedFunctions);
    } else if (typeof define === 'function' && define.amd) {
        define([], function() { return exportedFunctions; });
    }
})(); 