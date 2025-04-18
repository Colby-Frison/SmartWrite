/**
 * Text Layer Fix - Ensures proper alignment of text in PDF documents
 */

(function() {
    // Apply the fix when the document is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[TextLayerFix] Initializing text layer fix');
        
        // Add the CSS file to the document
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/frontend/public/text-layer-fix.css';
        document.head.appendChild(link);
        
        // Set up a mutation observer to watch for text layers
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    // Look for added text layers
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if this is a text layer or contains text layers
                            const textLayers = node.classList && node.classList.contains('textLayer') 
                                ? [node] 
                                : node.querySelectorAll('.textLayer');
                            
                            if (textLayers.length > 0) {
                                console.log(`[TextLayerFix] Found ${textLayers.length} text layer(s) to fix`);
                                textLayers.forEach(fixTextLayer);
                            }
                            
                            // Also look for text spans directly
                            const textSpans = node.querySelectorAll('.textLayer > span, .textLayer > div');
                            if (textSpans.length > 0) {
                                console.log(`[TextLayerFix] Found ${textSpans.length} text span(s) to fix`);
                                fixTextSpans(textSpans);
                            }
                        }
                    });
                }
            });
        });
        
        // Start observing document changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Also try to fix any existing text layers
        const existingTextLayers = document.querySelectorAll('.textLayer');
        if (existingTextLayers.length > 0) {
            console.log(`[TextLayerFix] Found ${existingTextLayers.length} existing text layer(s) to fix`);
            existingTextLayers.forEach(fixTextLayer);
        }
    });
    
    // Function to fix a text layer
    function fixTextLayer(textLayer) {
        // Remove any transform on the text layer itself
        textLayer.style.transform = 'none';
        
        // Fix all text spans in this layer
        const textSpans = textLayer.querySelectorAll('span, div');
        fixTextSpans(textSpans);
    }
    
    // Function to fix text spans
    function fixTextSpans(textSpans) {
        textSpans.forEach(function(span) {
            // Ensure the span has the correct transform
            span.style.transformOrigin = '0% 0%';
            span.style.transform = 'scaleX(0.7)';
        });
    }
})(); 