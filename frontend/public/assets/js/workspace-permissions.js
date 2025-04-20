// Function to show a user-friendly permission request dialog
function showPermissionRequestDialog() {
    console.log('[Workspace] Showing permission request dialog');
    
    // Create modal dialog overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'permissionRequestModal';
    overlay.style.zIndex = '3000';
    
    // Create modal window
    const modalWindow = document.createElement('div');
    modalWindow.className = 'modal-window';
    modalWindow.style.maxWidth = '500px';
    modalWindow.style.textAlign = 'center';
    
    // Create modal content
    modalWindow.innerHTML = `
        <div class="modal-header">
            <h2 class="modal-title">Workspace Permission Required</h2>
            <button class="modal-close" id="permissionRequestClose"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body" style="padding: 2rem 1.5rem;">
            <div style="font-size: 3rem; color: var(--accent-primary); margin-bottom: 1rem;">
                <i class="fas fa-folder-open"></i>
            </div>
            <p style="margin-bottom: 1.5rem;">Your browser requires explicit permission to access your workspace folder.</p>
            <p style="margin-bottom: 1.5rem;">This is a security feature to protect your files. You'll need to reselect your workspace folder once to grant permission.</p>
            <div style="font-size: 0.9rem; background-color: var(--bg-secondary); padding: 0.8rem; border-radius: 4px; margin-bottom: 1.5rem; text-align: left;">
                <strong>Tip for persistent access:</strong> When selecting your folder, be sure to check any "Remember this decision" options your browser presents. For best results, use Chrome or Edge browsers which offer better support for persistent permissions.
            </div>
        </div>
        <div class="modal-footer">
            <button class="modal-btn modal-btn-secondary" id="permissionRequestCancel">Cancel</button>
            <button class="modal-btn modal-btn-primary" id="permissionRequestConfirm">
                <i class="fas fa-folder"></i> Select Workspace Folder
            </button>
        </div>
    `;
    
    // Add the modal to the document
    overlay.appendChild(modalWindow);
    document.body.appendChild(overlay);
    
    // Add event listeners
    document.getElementById('permissionRequestClose').addEventListener('click', function() {
        document.getElementById('permissionRequestModal').remove();
        window.showEmptyWorkspaceMessage();
    });
    
    document.getElementById('permissionRequestCancel').addEventListener('click', function() {
        document.getElementById('permissionRequestModal').remove();
        window.showEmptyWorkspaceMessage();
    });
    
    document.getElementById('permissionRequestConfirm').addEventListener('click', function() {
        console.log('[Workspace Permissions] Select folder button clicked');
        document.getElementById('permissionRequestModal').remove();
        
        if (typeof window.selectWorkspaceFolder === 'function') {
            console.log('[Workspace Permissions] Calling selectWorkspaceFolder function');
            try {
                window.selectWorkspaceFolder();
            } catch (error) {
                console.error('[Workspace Permissions] Error calling selectWorkspaceFolder:', error);
                fallbackFolderSelect();
            }
        } else {
            console.error('[Workspace Permissions] selectWorkspaceFolder function not found');
            // Log available global functions for debugging
            console.log('[Workspace Permissions] Available global functions:', 
                Object.keys(window).filter(key => typeof window[key] === 'function').sort());
                
            fallbackFolderSelect();
        }
        
        // Fallback function to directly use the File System Access API
        async function fallbackFolderSelect() {
            console.log('[Workspace Permissions] Using direct folder selection fallback');
            
            // Try direct File System Access API if available
            if (typeof window.showDirectoryPicker === 'function') {
                try {
                    console.log('[Workspace Permissions] Using showDirectoryPicker API directly');
                    
                    // Use options that help with permission persistence
                    const options = {
                        id: 'workspaceFolder',  // Consistent ID for better permission matching
                        mode: 'readwrite',      // Request read-write access
                        startIn: 'documents'    // Start in documents folder by default
                    };
                    
                    const directoryHandle = await window.showDirectoryPicker(options);
                    
                    // Try to use the workspace's handle saving mechanism if available
                    if (typeof window.saveDirectoryHandle === 'function') {
                        console.log('[Workspace Permissions] Using saveDirectoryHandle to persist selection');
                        window.saveDirectoryHandle(directoryHandle);
                    } else {
                        // Fallback to basic localStorage and window global
                        console.log('[Workspace Permissions] Using basic localStorage fallback');
                        localStorage.setItem('workspaceFolderPath', directoryHandle.name);
                        window.workspaceFolderHandle = directoryHandle;
                        
                        // Try to update file system if function exists
                        if (typeof window.updateFileSystemFromLocalFolder === 'function') {
                            window.updateFileSystemFromLocalFolder(directoryHandle);
                        }
                        
                        // Reload the page to apply changes
                        setTimeout(() => {
                            console.log('[Workspace Permissions] Reloading page to apply changes');
                            window.location.reload();
                        }, 1000);
                    }
                    
                    return;
                } catch (error) {
                    console.error('[Workspace Permissions] Error with direct picker:', error);
                }
            }
            
            // If we get here, try opening the settings modal as last resort
            console.log('[Workspace Permissions] Using settings modal as last resort');
            if (typeof window.directOpenModal === 'function') {
                window.directOpenModal('settingsModal');
                // Try to switch to PDF viewer tab
                const pdfViewerTab = document.querySelector('.settings-sidebar li[data-setting="pdf-viewer"]');
                if (pdfViewerTab) {
                    pdfViewerTab.click();
                }
            }
        }
    });
}

// Function to enhance directory handle persistence
function enhanceDirectoryHandlePersistence() {
    console.log('[Workspace Permissions] Enhancing directory handle persistence');
    
    // Override the showDirectoryPicker function if available to add persistence options
    if (typeof window.showDirectoryPicker === 'function') {
        const originalShowDirectoryPicker = window.showDirectoryPicker;
        
        window.showDirectoryPicker = async function(options = {}) {
            // Enhance options with persistence-friendly values
            const enhancedOptions = {
                ...options,
                id: options.id || 'workspaceFolder',  // Use consistent ID
                mode: options.mode || 'readwrite',    // Always request readwrite by default
                startIn: options.startIn || 'documents' // Default to documents
            };
            
            console.log('[Workspace Permissions] Enhanced showDirectoryPicker with options:', enhancedOptions);
            
            try {
                // Call original with enhanced options
                const handle = await originalShowDirectoryPicker(enhancedOptions);
                
                // Store the successful handle in sessionStorage to help with browser refreshes
                try {
                    sessionStorage.setItem('lastSuccessfulDirSelection', new Date().toISOString());
                } catch (e) {
                    console.warn('[Workspace Permissions] Error saving to sessionStorage:', e);
                }
                
                return handle;
            } catch (error) {
                console.error('[Workspace Permissions] Error in enhanced showDirectoryPicker:', error);
                throw error;
            }
        };
        
        console.log('[Workspace Permissions] Successfully enhanced showDirectoryPicker for better persistence');
    }
}

// Intercept the DOMContentLoaded event to enhance permission handling
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Workspace Permissions] Script loaded, waiting for functions to be ready');
    
    // Try to access workspace functions, with a fallback if they're not immediately available
    function initPermissionHandlers() {
        // Check if required functions are available
        if (typeof window.verifyPermission !== 'function' || 
            typeof window.selectWorkspaceFolder !== 'function' ||
            typeof window.showEmptyWorkspaceMessage !== 'function') {
            console.log('[Workspace Permissions] Waiting for workspace functions to be defined...');
            setTimeout(initPermissionHandlers, 500); // Try again in 500ms
            return;
        }
        
        console.log('[Workspace Permissions] Workspace functions found, enhancing permission handling');
        
        // Enhance directory handle persistence
        enhanceDirectoryHandlePersistence();
        
        // Override the showEmptyWorkspaceMessage function to check if permission is needed
        const originalShowEmptyWorkspaceMessage = window.showEmptyWorkspaceMessage;
        
        window.showEmptyWorkspaceMessage = function() {
            // Check if we have a saved path that might need permission
            const savedPath = localStorage.getItem('workspaceFolderPath');
            
            if (savedPath) {
                // Instead of showing the empty message, show the permission request dialog
                showPermissionRequestDialog();
                return;
            }
            
            // Call the original function
            originalShowEmptyWorkspaceMessage.apply(this, arguments);
        };
        
        // Modify the existing permission error handling to use our dialog
        const originalVerifyPermission = window.verifyPermission;
        
        if (originalVerifyPermission) {
            window.verifyPermission = async function(fileHandle, readWrite = false) {
                const result = await originalVerifyPermission(fileHandle, readWrite);
                
                if (!result) {
                    // Permission denied, show our friendly dialog
                    showPermissionRequestDialog();
                }
                
                return result;
            };
            
            console.log('[Workspace Permissions] Enhanced permission handling enabled');
        }
    }
    
    // Start initialization
    initPermissionHandlers();
}, { once: true }); 