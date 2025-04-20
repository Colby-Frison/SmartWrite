// Force message display script
// This is a direct approach to force the "no file selected" message to appear

(function() {
    console.log('[Force Message] Script loaded');
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[Force Message] DOM loaded, waiting for PDF viewer');
        
        // Function to check if PDF viewer exists
        function checkAndApply() {
            const pdfViewer = document.getElementById('pdfViewer');
            if (!pdfViewer) {
                console.log('[Force Message] PDF viewer not found, waiting...');
                setTimeout(checkAndApply, 500);
                return;
            }
            
            console.log('[Force Message] PDF viewer found, clearing content');
            
            // Clear any existing content
            const pdfPagesContainer = document.getElementById('pdfPagesContainer');
            if (pdfPagesContainer) {
                pdfPagesContainer.style.display = 'none';
                pdfPagesContainer.innerHTML = '';
            }
            
            // Function to force message display
            function forceMessageDisplay() {
                console.log('[Force Message] Starting force message display');
                
                // Wait for file system to be populated
                if (typeof window.fileSystem === 'undefined' || 
                    !window.fileSystem.children || 
                    window.fileSystem.children.length === 0) {
                    console.log('[Force Message] No files in system yet, waiting...');
                    setTimeout(forceMessageDisplay, 1000);
                    return;
                }
                
                // Check if a file is already selected
                if (window.selectedItemId && window.selectedItemId !== 'root') {
                    console.log('[Force Message] File already selected, not showing message');
                    return;
                }
                
                // Check if our message display function is available
                if (typeof window.showNoFileSelectedMessage !== 'function') {
                    console.log('[Force Message] showNoFileSelectedMessage function not found, waiting...');
                    setTimeout(forceMessageDisplay, 500);
                    return;
                }
                
                // Make sure any PDF content is cleared and hidden
                if (pdfPagesContainer) {
                    pdfPagesContainer.style.display = 'none';
                    pdfPagesContainer.innerHTML = '';
                }
                
                // Hide any markdown section
                const markdownSection = document.querySelector('.markdown-section');
                if (markdownSection) {
                    markdownSection.style.display = 'none';
                }
                
                // Get or create the PDF container
                let pdfContainer = document.getElementById('pdfContainer');
                if (!pdfContainer) {
                    pdfContainer = document.createElement('div');
                    pdfContainer.id = 'pdfContainer';
                    pdfContainer.className = 'pdf-container';
                    pdfViewer.appendChild(pdfContainer);
                }
                
                // Clear existing content
                pdfContainer.innerHTML = '';
                
                // Make sure the container is visible
                pdfContainer.style.display = 'block';
                
                // Check if there's a workspace folder message
                const existingMessage = document.querySelector('.empty-workspace-message');
                if (existingMessage && existingMessage.innerHTML.includes('No Workspace Folder Selected')) {
                    console.log('[Force Message] Workspace folder message found, not showing file message');
                    return;
                }
                
                // Force display of our message
                console.log('[Force Message] Forcefully displaying no file selected message');
                window.showNoFileSelectedMessage();
            }
            
            // Start the force message process
            setTimeout(forceMessageDisplay, 2000); // Wait for everything to be ready
        }
        
        // Start checking for PDF viewer
        checkAndApply();
    });
})(); 