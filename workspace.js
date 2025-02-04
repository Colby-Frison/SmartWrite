// Modal Functions
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

window.saveSettings = function() {
    const themeToggle = document.getElementById('themeToggle');
    const defaultZoom = document.getElementById('defaultZoom');
    
    // Save settings to localStorage
    localStorage.setItem('darkMode', themeToggle.checked);
    localStorage.setItem('defaultZoom', defaultZoom.value);
    
    // Apply settings
    document.documentElement.setAttribute('data-theme', themeToggle.checked ? 'dark' : 'light');
    // Update zoom level if a PDF is open
    if (currentPDF) {
        setZoomLevel(parseFloat(defaultZoom.value));
    }
    
    closeModal('settingsModal');
}

window.saveProfile = function() {
    const displayName = document.getElementById('displayName').value;
    const email = document.getElementById('email').value;
    const bio = document.getElementById('bio').value;
    
    // Save profile data to localStorage
    localStorage.setItem('userProfile', JSON.stringify({
        displayName,
        email,
        bio
    }));
    
    closeModal('profileModal');
}

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const toggle = document.querySelector('.sidebar-toggle');
    const mainContent = document.querySelector('.main-content');
    const pdfSection = document.querySelector('.pdf-section');
    
    if (toggle && sidebar) {
        toggle.onclick = (e) => {
            e.preventDefault();
            sidebar.classList.toggle('collapsed');
            
            // Force layout recalculation and center the PDF
            if (pdfSection) {
                pdfSection.style.width = sidebar.classList.contains('collapsed') 
                    ? 'calc(100% - 400px)' // Collapsed - only account for chat section
                    : 'calc(100% - 700px)'; // Expanded - account for sidebar and chat
                
                // Center the PDF viewer horizontally after width change
                setTimeout(() => {
                    const pdfViewer = document.querySelector('.pdf-viewer');
                    if (pdfViewer) {
                        pdfViewer.scrollLeft = (pdfViewer.scrollWidth - pdfViewer.clientWidth) / 2;
                    }
                }, 50); // Small delay to ensure width transition is complete
            }
        };
    }

    // Chat Input Auto-resize
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');

    chatInput.addEventListener('input', function() {
        if (this.value.trim()) {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
            this.style.overflowY = 'auto';
        } else {
            this.style.height = 'auto';
            this.style.overflowY = 'hidden';
        }
    });

    // Clear input and reset styles
    function clearChatInput() {
        chatInput.value = '';
        chatInput.style.height = 'auto';
        chatInput.style.overflowY = 'hidden';
    }

    // Send Message Function
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message
        addMessage(message, 'user');

        // Clear input and reset styles
        clearChatInput();

        // Simulate AI response (replace with actual API call)
        setTimeout(() => {
            const response = "I've received your message. This is a placeholder response. In the actual implementation, this would be replaced with an AI-generated response based on your message and the PDF content.";
            addMessage(response, 'assistant');
        }, 1000);
    }

    // Add message to chat
    function addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Send message on button click
    sendButton.addEventListener('click', sendMessage);

    // Send message on Enter (but new line on Shift+Enter)
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // PDF functionality
    const viewer = document.getElementById('pdfViewer');
    let currentScale = 1.0;
    let currentPDF = null;
    
    // Initialize PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    // Add zoom controls
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const zoomLevel = document.getElementById('zoomLevel');

    function updateZoom(newScale) {
        currentScale = newScale;
        zoomLevel.textContent = `${Math.round(currentScale * 100)}%`;
        
        // Update all canvases with new width
        document.querySelectorAll('.pdf-page-container canvas').forEach(canvas => {
            const baseWidth = 680; // Base width
            canvas.style.width = `${baseWidth * currentScale}px`;
        });
    }

    // Add scroll-to-zoom on zoom level hover
    if (zoomLevel) {
        zoomLevel.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.max(0.25, Math.min(3.0, currentScale + delta));
            updateZoom(newScale);
        });
    }

    if (zoomIn) {
        zoomIn.addEventListener('click', () => {
            updateZoom(Math.min(currentScale + 0.25, 3.0));
        });
    }

    if (zoomOut) {
        zoomOut.addEventListener('click', () => {
            updateZoom(Math.max(currentScale - 0.25, 0.25));
        });
    }

    // Add mouse wheel zoom with Ctrl key
    viewer.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.max(0.25, Math.min(3.0, currentScale + delta));
            updateZoom(newScale);
        }
    });

    // Load saved PDFs
    const savedPDFs = JSON.parse(localStorage.getItem('savedPDFs') || '[]');
    if (savedPDFs.length > 0 && viewer) {
        const pdfData = savedPDFs[0];
        const byteCharacters = atob(pdfData.data.split(',')[1]);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        pdfjsLib.getDocument(url).promise.then(pdf => {
            currentPDF = pdf;
            viewer.innerHTML = '';
            const container = document.createElement('div');
            container.className = 'pdfViewerCanvas';
            viewer.appendChild(container);
            
            // Load and render all pages
            async function renderPages() {
                try {
                    // Get all pages
                    const numPages = pdf.numPages;
                    
                    // Render each page
                    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const viewport = page.getViewport({ scale: 1.0 });
                        const scale = 680 / viewport.width; // Base width / original width
                        const scaledViewport = page.getViewport({ scale });
                        
                        // Create page container
                        const pageContainer = document.createElement('div');
                        pageContainer.className = 'pdf-page-container';
                        container.appendChild(pageContainer);
                        
                        // Create canvas
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = scaledViewport.height;
                        canvas.width = scaledViewport.width;
                        
                        // Add canvas to page container
                        pageContainer.appendChild(canvas);
                        
                        // Render the page
                        await page.render({
                            canvasContext: context,
                            viewport: scaledViewport
                        }).promise;
                    }
                    
                    // Apply initial zoom if needed
                    if (currentScale !== 1.0) {
                        updateZoom(currentScale);
                    }
                    
                } catch (error) {
                    console.error('Error rendering PDF pages:', error);
                }
            }
            
            renderPages();
        }).catch(console.error);
    }

    // Add keyboard shortcuts for switching PDFs
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (currentPdfIndex > 0) {
                    currentPdfIndex--;
                    updatePdfFilesBar();
                    displayCurrentPDF();
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (currentPdfIndex < pdfs.length - 1) {
                    currentPdfIndex++;
                    updatePdfFilesBar();
                    displayCurrentPDF();
                }
            }
        }
    });

    // Initialize
    loadSavedPDFs();

    // Resize functionality
    const chatSection = document.querySelector('.chat-section');
    let isResizing = false;
    let currentResizer = null;

    // Mouse events for sidebar resize
    sidebar.addEventListener('mousedown', function(e) {
        const rect = sidebar.getBoundingClientRect();
        if (e.clientX > rect.right - 5 && e.clientX < rect.right + 5) {
            isResizing = true;
            currentResizer = sidebar;
        }
    });

    // Mouse events for chat section resize
    chatSection.addEventListener('mousedown', function(e) {
        const rect = chatSection.getBoundingClientRect();
        if (e.clientX > rect.left - 5 && e.clientX < rect.left + 5) {
            isResizing = true;
            currentResizer = chatSection;
            document.body.style.cursor = 'ew-resize';
            e.preventDefault();
        }
    });

    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;

        if (currentResizer === sidebar) {
            const newWidth = e.clientX;
            if (newWidth >= 75 && newWidth <= 500) {
                currentResizer.style.width = newWidth + 'px';
            }
        } else if (currentResizer === chatSection) {
            const rect = chatSection.parentElement.getBoundingClientRect();
            const newWidth = rect.right - e.clientX;
            
            // Apply constraints
            if (newWidth >= 300 && newWidth <= 800) {
                currentResizer.style.width = newWidth + 'px';
                
                // Save the width preference
                localStorage.setItem('chatSectionWidth', newWidth);
                
                // Center the PDF viewer after resize
                const pdfViewer = document.querySelector('.pdf-viewer');
                if (pdfViewer) {
                    pdfViewer.scrollLeft = (pdfViewer.scrollWidth - pdfViewer.clientWidth) / 2;
                }
            }
        }
    });

    document.addEventListener('mouseup', function() {
        if (isResizing) {
        isResizing = false;
        currentResizer = null;
            document.body.style.cursor = '';
        }
    });

    // Initialize modal event listeners
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Handle modal triggers
    document.querySelectorAll('.dropdown-item[data-modal]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = item.getAttribute('data-modal');
            openModal(modalId);
        });
    });

    // Load saved settings and profile
    const savedTheme = localStorage.getItem('darkMode');
    const savedZoom = localStorage.getItem('defaultZoom');
    
    if (savedTheme !== null) {
        document.getElementById('themeToggle').checked = savedTheme === 'true';
    }
    if (savedZoom) {
        document.getElementById('defaultZoom').value = savedZoom;
    }
    
    // Load profile
    const savedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (savedProfile) {
        document.getElementById('displayName').value = savedProfile.displayName || '';
        document.getElementById('email').value = savedProfile.email || '';
        document.getElementById('bio').value = savedProfile.bio || '';
    }

    // Initialize settings from localStorage
    initializeSettings();
    
    // Handle settings sidebar navigation
    const sidebarItems = document.querySelectorAll('.settings-sidebar li');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            sidebarItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all panels
            document.querySelectorAll('.settings-panel').forEach(panel => {
                panel.style.display = 'none';
            });
            
            // Show selected panel
            const panelId = this.getAttribute('data-setting') + '-panel';
            const selectedPanel = document.getElementById(panelId);
            if (selectedPanel) {
                selectedPanel.style.display = 'block';
            }
        });
    });

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', function() {
            const theme = this.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    }

    // PDF zoom functionality
    const zoomSelect = document.getElementById('defaultZoom');
    if (zoomSelect) {
        zoomSelect.addEventListener('change', function() {
            const zoomLevel = parseFloat(this.value);
            localStorage.setItem('defaultZoom', zoomLevel);
            // If there's a PDF open, update its zoom
            if (typeof currentPDF !== 'undefined' && currentPDF) {
                setZoomLevel(zoomLevel);
            }
        });
    }

    // Sidebar toggle functionality
    const sidebarToggle = document.getElementById('sidebarToggle');

    function toggleSidebar() {
        if (!sidebar || !sidebarToggle) return;
        
        const isCollapsed = sidebar.classList.contains('collapsed');
        sidebar.classList.toggle('collapsed');
        
        // Update icon rotation
        const icon = sidebarToggle.querySelector('i');
        if (icon) {
            icon.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)';
        }
        
        // Save state
        localStorage.setItem('sidebarCollapsed', !isCollapsed);
    }

    // Add click event listener
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });
    }

    // Restore sidebar state on load
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        toggleSidebar();
    }

    // Center PDF viewer scroll position
    const pdfViewer = document.querySelector('.pdf-viewer');
    if (pdfViewer) {
        pdfViewer.addEventListener('load', function() {
            // Center the scroll position
            setTimeout(() => {
                const scrollWidth = pdfViewer.scrollWidth - pdfViewer.clientWidth;
                pdfViewer.scrollLeft = scrollWidth / 2;
            }, 100);
        }, true);

        // Also center when PDF is loaded
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    const scrollWidth = pdfViewer.scrollWidth - pdfViewer.clientWidth;
                    pdfViewer.scrollLeft = scrollWidth / 2;
                }
            });
        });

        observer.observe(pdfViewer, { childList: true, subtree: true });
    }

    // Add this after PDF.js initialization
    if (viewer) {
        // Center the PDF viewer horizontally when it loads
        const centerPdfViewer = () => {
            viewer.scrollLeft = (viewer.scrollWidth - viewer.clientWidth) / 2;
        };

        // Center when PDF is loaded
        viewer.addEventListener('load', centerPdfViewer);
        
        // Also center when window is resized
        window.addEventListener('resize', centerPdfViewer);
        
        // Initial centering
        setTimeout(centerPdfViewer, 100); // Small delay to ensure content is loaded
    }

    // Restore chat section width from localStorage
    const savedChatWidth = localStorage.getItem('chatSectionWidth');
    if (savedChatWidth && chatSection) {
        chatSection.style.width = `${savedChatWidth}px`;
    }
});

// Settings functionality
function initializeSettings() {
    // Theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Font Size
    const savedFontSize = localStorage.getItem('fontSize') || '14';
    const fontSelect = document.getElementById('fontSize');
    if (fontSelect) {
        fontSelect.value = savedFontSize;
        document.documentElement.style.fontSize = savedFontSize + 'px';
    }

    // Auto Save
    const savedAutoSave = localStorage.getItem('autoSave') !== 'false';
    const autoSaveToggle = document.getElementById('autoSave');
    if (autoSaveToggle) {
        autoSaveToggle.checked = savedAutoSave;
    }

    // Spell Check
    const savedSpellCheck = localStorage.getItem('spellCheck') === 'true';
    const spellCheckToggle = document.getElementById('spellCheck');
    if (spellCheckToggle) {
        spellCheckToggle.checked = savedSpellCheck;
    }

    // PDF Zoom
    const savedZoom = localStorage.getItem('defaultZoom') || '1';
    const zoomSelect = document.getElementById('defaultZoom');
    if (zoomSelect) {
        zoomSelect.value = savedZoom;
    }

    // Smooth Scroll
    const savedSmoothScroll = localStorage.getItem('smoothScroll') !== 'false';
    const smoothScrollToggle = document.getElementById('smoothScroll');
    if (smoothScrollToggle) {
        smoothScrollToggle.checked = savedSmoothScroll;
        const pdfViewer = document.getElementById('pdfViewer');
        if (pdfViewer) {
            pdfViewer.style.scrollBehavior = savedSmoothScroll ? 'smooth' : 'auto';
        }
    }

    // Show the first panel by default
    const firstPanel = document.querySelector('.settings-panel');
    if (firstPanel) {
        firstPanel.style.display = 'block';
    }
}

// Settings event handlers
function setupSettingsHandlers() {
    // Tab switching
    const sidebarItems = document.querySelectorAll('.settings-sidebar li');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            // Update active tab
            sidebarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Show corresponding panel
            const panels = document.querySelectorAll('.settings-panel');
            panels.forEach(panel => panel.style.display = 'none');
            
            const targetPanel = document.getElementById(this.getAttribute('data-setting') + '-panel');
            if (targetPanel) {
                targetPanel.style.display = 'block';
            }
        });
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', function() {
            const theme = this.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    }

    // Font size
    const fontSelect = document.getElementById('fontSize');
    if (fontSelect) {
        fontSelect.addEventListener('change', function() {
            document.documentElement.style.fontSize = this.value + 'px';
            localStorage.setItem('fontSize', this.value);
        });
    }

    // Auto save
    const autoSaveToggle = document.getElementById('autoSave');
    if (autoSaveToggle) {
        autoSaveToggle.addEventListener('change', function() {
            localStorage.setItem('autoSave', this.checked);
        });
    }

    // Spell check
    const spellCheckToggle = document.getElementById('spellCheck');
    if (spellCheckToggle) {
        spellCheckToggle.addEventListener('change', function() {
            localStorage.setItem('spellCheck', this.checked);
            const textInputs = document.querySelectorAll('textarea, [contenteditable="true"]');
            textInputs.forEach(input => {
                input.spellcheck = this.checked;
            });
        });
    }

    // PDF zoom
    const zoomSelect = document.getElementById('defaultZoom');
    if (zoomSelect) {
        zoomSelect.addEventListener('change', function() {
            localStorage.setItem('defaultZoom', this.value);
            if (typeof currentPDF !== 'undefined' && currentPDF) {
                setZoomLevel(parseFloat(this.value));
            }
        });
    }

    // Smooth scroll
    const smoothScrollToggle = document.getElementById('smoothScroll');
    if (smoothScrollToggle) {
        smoothScrollToggle.addEventListener('change', function() {
            localStorage.setItem('smoothScroll', this.checked);
            const pdfViewer = document.getElementById('pdfViewer');
            if (pdfViewer) {
                pdfViewer.style.scrollBehavior = this.checked ? 'smooth' : 'auto';
            }
        });
    }
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSettings();
    setupSettingsHandlers();
    
    // Rest of your existing DOMContentLoaded code...
}); 