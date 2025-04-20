// File Selection Messages Handler
// This script provides message displays for file selection scenarios

// Function to show a "no file selected" message
function showNoFileSelectedMessage() {
    console.log('[Workspace] Showing no file selected message');
    
    // Find or create PDF viewer (which is our main content area)
    const pdfViewer = document.getElementById('pdfViewer');
    if (!pdfViewer) {
        console.error('[Workspace] PDF viewer element not found');
        return;
    }
    
    // Hide any markdown section if visible
    const markdownSection = document.querySelector('.markdown-section');
    if (markdownSection) {
        markdownSection.style.display = 'none';
    }
    
    // First, ensure any PDF pages container is hidden
    const pdfPagesContainer = document.getElementById('pdfPagesContainer');
    if (pdfPagesContainer) {
        pdfPagesContainer.style.display = 'none';
        console.log('[Workspace] Hiding PDF pages container');
    }
    
    // Create or get the PDF container
    let pdfContainer = document.getElementById('pdfContainer');
    if (!pdfContainer) {
        pdfContainer = document.createElement('div');
        pdfContainer.id = 'pdfContainer';
        pdfContainer.className = 'pdf-container';
        pdfViewer.appendChild(pdfContainer);
    } else {
        // Clear existing content
        pdfContainer.innerHTML = '';
    }
    
    // Make sure the pdfContainer is visible
    pdfContainer.style.display = 'block';
    
    // Create and add the no file selected message
    const noFileMessage = document.createElement('div');
    noFileMessage.className = 'empty-workspace-message';
    noFileMessage.style.display = 'flex';  // Force display
    noFileMessage.style.zIndex = '10';     // Ensure it's on top
    noFileMessage.innerHTML = `
        <i class="fas fa-file-alt" style="font-size: 3rem; color: var(--accent-primary); margin-bottom: 1rem;"></i>
        <h3>No File Selected</h3>
        <p>Select a file from your workspace to view its contents.</p>
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 1rem;">
            <i class="fas fa-info-circle"></i> You can browse files in the file tree on the left.
        </p>
    `;
    pdfContainer.appendChild(noFileMessage);
    
    // Force the PDF viewer to be visible
    pdfViewer.style.display = 'block';
    
    console.log('[Workspace] No file selected message displayed');
}

// Function to show "file type not supported" message
function showFileNotSupportedMessage(fileName, fileType) {
    console.log(`[Workspace] Showing file not supported message for: ${fileName} (${fileType})`);
    
    // Find or create PDF viewer (which is our main content area)
    const pdfViewer = document.getElementById('pdfViewer');
    if (!pdfViewer) {
        console.error('[Workspace] PDF viewer element not found');
        return;
    }
    
    // Hide any markdown section if visible
    const markdownSection = document.querySelector('.markdown-section');
    if (markdownSection) {
        markdownSection.style.display = 'none';
    }
    
    // Create or get the PDF container
    let pdfContainer = document.getElementById('pdfContainer');
    if (!pdfContainer) {
        pdfContainer = document.createElement('div');
        pdfContainer.id = 'pdfContainer';
        pdfContainer.className = 'pdf-container';
        pdfViewer.appendChild(pdfContainer);
    } else {
        // Clear existing content
        pdfContainer.innerHTML = '';
    }
    
    // Create and add the file not supported message
    const notSupportedMessage = document.createElement('div');
    notSupportedMessage.className = 'empty-workspace-message';
    notSupportedMessage.innerHTML = `
        <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #e74c3c; margin-bottom: 1rem;"></i>
        <h3>File Type Not Supported</h3>
        <p>The file "<strong>${fileName}</strong>" cannot be previewed.</p>
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 1rem;">
            <i class="fas fa-info-circle"></i> This application currently supports PDF and Markdown (.md) files for preview.
        </p>
    `;
    pdfContainer.appendChild(notSupportedMessage);
}

// Function to check if we should show the "no file selected" message
function checkAndShowNoFileMessage() {
    console.log('[File Messages] Checking if we should show no file selected message');
    
    // First check if we even have files in the system
    const hasFiles = window.fileSystem && 
                    window.fileSystem.children && 
                    window.fileSystem.children.length > 0;
    
    if (!hasFiles) {
        console.log('[File Messages] No files in system, not showing file selection message');
        return; // Don't show the message if there are no files
    }
    
    // Check if there's a file selected
    const hasSelection = window.selectedItemId !== null && 
                         window.selectedItemId !== undefined && 
                         window.selectedItemId !== 'root';
    
    console.log('[File Messages] Selection status:', { 
        hasFiles, 
        hasSelection,
        selectedItemId: window.selectedItemId
    });
    
    // If there are files but no selection, we should show the message
    if (hasFiles && !hasSelection) {
        // First check if there's already content showing
        const existingEmptyMessage = document.querySelector('.empty-workspace-message');
        
        // Check if the empty message is the workspace folder message (not our message)
        let isWorkspaceFolderMessage = false;
        if (existingEmptyMessage) {
            isWorkspaceFolderMessage = existingEmptyMessage.innerHTML.includes('No Workspace Folder Selected');
            console.log('[File Messages] Found existing message:', isWorkspaceFolderMessage ? 
                       'workspace folder message' : 'our message or other');
        }
        
        // If it's a workspace folder message, don't override it
        if (isWorkspaceFolderMessage) {
            console.log('[File Messages] Won\'t override workspace folder message');
            return;
        }
        
        // Check for actual content
        const pdfPagesContainer = document.getElementById('pdfPagesContainer');
        const markdownSection = document.querySelector('.markdown-section');
        
        // Check if PDF container has real content (not just a loading message)
        let pdfHasContent = false;
        if (pdfPagesContainer) {
            // Check if display is set to block and there's content
            pdfHasContent = pdfPagesContainer.style.display === 'block' && 
                           pdfPagesContainer.childElementCount > 0 &&
                           !pdfPagesContainer.innerHTML.includes('pdf-loading');
            
            console.log('[File Messages] PDF container status:', {
                display: pdfPagesContainer.style.display,
                childCount: pdfPagesContainer.childElementCount,
                hasContent: pdfHasContent
            });
        }
        
        // Check if Markdown section is showing content
        let markdownHasContent = false;
        if (markdownSection) {
            markdownHasContent = markdownSection.style.display === 'flex' || 
                                markdownSection.style.display === 'block';
            
            console.log('[File Messages] Markdown section status:', {
                display: markdownSection.style.display,
                hasContent: markdownHasContent
            });
        }
        
        if (existingEmptyMessage && !isWorkspaceFolderMessage) {
            console.log('[File Messages] Our message is already showing');
            return;
        }
        
        if (pdfHasContent || markdownHasContent) {
            console.log('[File Messages] Content is already showing, clearing it first');
            
            // Clear existing content to make way for our message
            if (pdfPagesContainer) {
                pdfPagesContainer.style.display = 'none';
            }
            
            if (markdownSection) {
                markdownSection.style.display = 'none';
            }
        }
        
        console.log('[File Messages] Showing no file selected message');
        showNoFileSelectedMessage();
    } else if (hasSelection) {
        console.log('[File Messages] File is selected, no need for message');
    }
}

// Make functions globally available
window.showNoFileSelectedMessage = showNoFileSelectedMessage;
window.showFileNotSupportedMessage = showFileNotSupportedMessage;
window.checkAndShowNoFileMessage = checkAndShowNoFileMessage;

// Add a function to directly clear PDF content and show message
window.forceClearAndShowMessage = function() {
    console.log('[File Messages] Forcefully clearing content and showing message');
    
    // Clear PDF content
    const pdfPagesContainer = document.getElementById('pdfPagesContainer');
    if (pdfPagesContainer) {
        pdfPagesContainer.style.display = 'none';
        pdfPagesContainer.innerHTML = '';
    }
    
    // Clear Markdown content
    const markdownSection = document.querySelector('.markdown-section');
    if (markdownSection) {
        markdownSection.style.display = 'none';
    }
    
    // Show our message
    showNoFileSelectedMessage();
};

// Add event listener to check for showing the no file selected message
document.addEventListener('DOMContentLoaded', function() {
    console.log('[File Messages] DOM content loaded, initializing file selection messages');
    
    // First initialization - needs to be delayed to let the file system load
    setTimeout(function initiateFirstCheck() {
        if (!document.getElementById('pdfViewer')) {
            console.log('[File Messages] Waiting for pdfViewer to be available...');
            setTimeout(initiateFirstCheck, 500);
            return;
        }
        
        // Wait for filesystem to be populated
        if (typeof window.fileSystem === 'undefined') {
            console.log('[File Messages] Waiting for fileSystem to be available...');
            setTimeout(initiateFirstCheck, 500);
            return;
        }
        
        // Force clear any default content and show message
        if (window.fileSystem && window.fileSystem.children && window.fileSystem.children.length > 0) {
            // If we have files but no selection, forcefully show message
            if (!window.selectedItemId || window.selectedItemId === 'root') {
                window.forceClearAndShowMessage();
            }
        }
        
        // Check at regular intervals for the first 5 seconds
        let checkCount = 0;
        const maxChecks = 5;
        
        function periodicCheck() {
            checkCount++;
            console.log(`[File Messages] Periodic check ${checkCount}/${maxChecks}`);
            
            checkAndShowNoFileMessage();
            
            if (checkCount < maxChecks) {
                setTimeout(periodicCheck, 1000);
            }
        }
        
        // Start periodic checking
        periodicCheck();
        
    }, 1500); // Initial delay to let the page load
    
    // Also listen for file tree updates, which might indicate files were loaded
    const observer = new MutationObserver(function(mutations) {
        console.log('[File Messages] File tree mutation detected, checking if we should show message');
        // Only check if we detect changes to the file tree
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Wait a bit for the selection to be processed
                setTimeout(checkAndShowNoFileMessage, 500);
            }
        });
    });
    
    // Start observing the file tree
    const fileTree = document.getElementById('fileTree');
    if (fileTree) {
        observer.observe(fileTree, { childList: true, subtree: true });
        console.log('[File Messages] Now observing file tree for changes');
    } else {
        console.log('[File Messages] File tree not found, will check again later');
        // Try again later
        setTimeout(function() {
            const fileTree = document.getElementById('fileTree');
            if (fileTree) {
                observer.observe(fileTree, { childList: true, subtree: true });
                console.log('[File Messages] Now observing file tree for changes (delayed)');
            }
        }, 2000);
    }

    // Wait for the fileSystem object to become available
    const checkInterval = setInterval(function() {
        if (typeof window.fileSystem !== 'undefined') {
            console.log('[File Messages] fileSystem found, adding hooks');
            clearInterval(checkInterval);
            
            // Create a direct trigger to show the no file selected message
            window.triggerNoFileSelectedMessage = function() {
                console.log('[File Messages] Direct trigger for no file selected message');
                
                // Wait for any pending UI updates
                setTimeout(function() {
                    // If we have files but no selection, show the message
                    if (window.fileSystem && 
                        window.fileSystem.children && 
                        window.fileSystem.children.length > 0 && 
                        (!window.selectedItemId || window.selectedItemId === 'root')) {
                        
                        // First check if there's an existing workspace folder message
                        const existingEmptyMessage = document.querySelector('.empty-workspace-message');
                        if (existingEmptyMessage && existingEmptyMessage.innerHTML.includes('No Workspace Folder Selected')) {
                            console.log('[File Messages] Won\'t override workspace folder message');
                            return;
                        }
                        
                        // Always clear existing content to make room for our message
                        const pdfPagesContainer = document.getElementById('pdfPagesContainer');
                        if (pdfPagesContainer) {
                            pdfPagesContainer.style.display = 'none';
                            // Consider clearing content if needed
                            if (pdfPagesContainer.innerHTML.includes('pdf-page')) {
                                console.log('[File Messages] Clearing PDF page content');
                                pdfPagesContainer.innerHTML = '';
                            }
                        }
                        
                        const markdownSection = document.querySelector('.markdown-section');
                        if (markdownSection) {
                            markdownSection.style.display = 'none';
                        }
                        
                        console.log('[File Messages] Forcefully showing no file selected message');
                        showNoFileSelectedMessage();
                    } else {
                        console.log('[File Messages] No files or selection exists, not showing message', {
                            hasFiles: window.fileSystem && window.fileSystem.children && window.fileSystem.children.length > 0,
                            selectedItemId: window.selectedItemId
                        });
                    }
                }, 500);
            };
            
            // Listen for changes in the file tree
            const fileTree = document.getElementById('fileTree');
            if (fileTree) {
                console.log('[File Messages] Adding click event listener to file tree');
                
                // Add a click event listener to handle clicks outside of items
                fileTree.addEventListener('click', function(e) {
                    // Check if click was directly on the file tree (not on an item)
                    if (e.target === fileTree) {
                        console.log('[File Messages] Clicked on empty space in file tree');
                        window.triggerNoFileSelectedMessage();
                    }
                });
            }
            
            // Call once initially after a delay
            setTimeout(window.triggerNoFileSelectedMessage, 2000);
            
            // Also add a button to manually trigger the message
            const sidebarHeader = document.querySelector('.sidebar-header');
            if (sidebarHeader) {
                const debugButton = document.createElement('button');
                debugButton.textContent = '📄';
                debugButton.title = 'Show No File Selected Message';
                debugButton.style.background = 'none';
                debugButton.style.border = 'none';
                debugButton.style.cursor = 'pointer';
                debugButton.style.fontSize = '1.2rem';
                debugButton.style.padding = '0 5px';
                debugButton.style.opacity = '0.6';
                debugButton.addEventListener('click', window.triggerNoFileSelectedMessage);
                
                // Add to the end of the sidebar header
                sidebarHeader.appendChild(debugButton);
                console.log('[File Messages] Added debug button to sidebar header');
            }
        }
    }, 500);
}); 