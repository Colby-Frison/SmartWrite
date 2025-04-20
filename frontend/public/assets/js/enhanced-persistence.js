// Enhanced Directory Persistence Handler
// This script improves the persistence of directory permissions between page refreshes

(function() {
    console.log('[Enhanced Persistence] Initializing enhanced directory persistence handler');
    
    // Function to initialize our enhanced handling
    function initEnhancedPersistence() {
        // Check if the File System Access API is available
        if (typeof window.showDirectoryPicker !== 'function') {
            console.log('[Enhanced Persistence] File System Access API not available yet, waiting...');
            setTimeout(initEnhancedPersistence, 500);
            return;
        }
        
        console.log('[Enhanced Persistence] File System Access API available, enhancing persistence behavior');
        
        // Store the original directory picker function
        const originalDirectoryPicker = window.showDirectoryPicker;
        
        // Override with our enhanced version
        window.showDirectoryPicker = async function(options = {}) {
            console.log('[Enhanced Persistence] Using enhanced directory picker');
            
            // Add persistence-friendly options
            const enhancedOptions = {
                ...options,
                id: options.id || 'workspaceFolder',
                mode: options.mode || 'readwrite', 
                startIn: options.startIn || 'documents'
            };
            
            console.log('[Enhanced Persistence] Enhanced options:', enhancedOptions);
            
            try {
                // Call original with enhanced options
                const handle = await originalDirectoryPicker(enhancedOptions);
                console.log('[Enhanced Persistence] Directory selected successfully:', handle.name);
                
                // For additional persistence, try to immediately verify and request permission
                // This helps "cement" the permission with the browser
                try {
                    const options = { mode: 'readwrite' };
                    
                    // First check current permission
                    if (await handle.queryPermission(options) !== 'granted') {
                        // Then explicitly request permission
                        await handle.requestPermission(options);
                        console.log('[Enhanced Persistence] Explicitly requested and reinforced permission');
                    }
                    
                    // Try multiple verification attempts with delay to help browser persistence
                    setTimeout(async () => {
                        try {
                            const verifyResult = await handle.queryPermission(options);
                            console.log('[Enhanced Persistence] Delayed permission check result:', verifyResult);
                        } catch (e) {
                            console.warn('[Enhanced Persistence] Delayed permission check failed:', e);
                        }
                    }, 1000);
                    
                } catch (permError) {
                    console.warn('[Enhanced Persistence] Permission reinforcement failed:', permError);
                }
                
                return handle;
            } catch (error) {
                console.error('[Enhanced Persistence] Error in enhanced picker:', error);
                throw error;
            }
        };
        
        // If available, enhance the verifyPermission function
        if (typeof window.verifyPermission === 'function') {
            const originalVerifyPermission = window.verifyPermission;
            
            window.verifyPermission = async function(fileHandle, readWrite = false) {
                console.log('[Enhanced Persistence] Enhanced verify permission called');
                
                try {
                    // Try multiple times with increasing delays
                    // This helps with browsers that may have transient permission issues
                    for (let attempt = 0; attempt < 3; attempt++) {
                        if (attempt > 0) {
                            console.log(`[Enhanced Persistence] Retry attempt ${attempt}/2`);
                            // Wait before retrying (exponential backoff)
                            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
                        }
                        
                        // Call the original verify permission function
                        const result = await originalVerifyPermission(fileHandle, readWrite);
                        
                        if (result) {
                            console.log('[Enhanced Persistence] Permission verified successfully');
                            return true;
                        }
                    }
                    
                    console.warn('[Enhanced Persistence] Permission verification failed after retries');
                    return false;
                } catch (error) {
                    console.error('[Enhanced Persistence] Error in enhanced verify permission:', error);
                    return false;
                }
            };
            
            console.log('[Enhanced Persistence] Enhanced verifyPermission function');
        }
        
        // Add a workaround for browsers that don't persist permissions well
        // Try to detect if we need to prompt for reselection
        window.addEventListener('load', function() {
            setTimeout(async function() {
                try {
                    // If we've implemented special handling in IndexedDB
                    if (typeof window.getDirectoryHandle === 'function') {
                        const handle = await window.getDirectoryHandle();
                        
                        if (handle) {
                            console.log('[Enhanced Persistence] Testing permission on page load for IndexedDB handle');
                            
                            // Try to list directory contents as a permission test
                            try {
                                let hasAccess = false;
                                
                                // First try to query permission
                                if (typeof handle.queryPermission === 'function') {
                                    const permission = await handle.queryPermission({ mode: 'read' });
                                    hasAccess = permission === 'granted';
                                    console.log('[Enhanced Persistence] Permission query result:', permission);
                                }
                                
                                // If not confirmed by query, try to actually access the directory
                                if (!hasAccess) {
                                    // Try to get a file handle as a test
                                    for await (const [name, entry] of handle.entries()) {
                                        console.log('[Enhanced Persistence] Successfully accessed directory entry:', name);
                                        hasAccess = true;
                                        break;
                                    }
                                }
                                
                                console.log('[Enhanced Persistence] Directory access test result:', hasAccess ? 'Success' : 'Failed');
                                
                                // If we don't have access, trigger reselection dialog
                                if (!hasAccess && typeof window.showPermissionRequestDialog === 'function') {
                                    console.log('[Enhanced Persistence] Triggering permission request dialog');
                                    window.showPermissionRequestDialog();
                                }
                            } catch (error) {
                                console.error('[Enhanced Persistence] Directory access test error:', error);
                                // Permission issue - trigger reselection dialog
                                if (typeof window.showPermissionRequestDialog === 'function') {
                                    window.showPermissionRequestDialog();
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('[Enhanced Persistence] Error in page load permission check:', error);
                }
            }, 1500); // Wait for page to be fully initialized
        });
        
        console.log('[Enhanced Persistence] Directory persistence enhancement applied');
    }
    
    // Start initialization after a short delay
    setTimeout(initEnhancedPersistence, 500);
})(); 