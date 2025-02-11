// Add this debounce function at the top of the file
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Make functions available globally
window.openModal = openModal;
window.closeModal = closeModal;

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
    console.log('DOM Content Loaded in workspace.js');
    console.log('electronAPI available:', !!window.electronAPI);
    
    const minimizeBtn = document.querySelector('#minimizeBtn');
    const maximizeBtn = document.querySelector('#maximizeBtn');
    const closeBtn = document.querySelector('#closeBtn');
    
    console.log('Buttons found:', { 
        minimize: !!minimizeBtn, 
        maximize: !!maximizeBtn, 
        close: !!closeBtn 
    }); // Debug log

    if (!window.electronAPI) {
        console.error('electronAPI not found. Make sure preload script is working.');
        return;
    }

    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', function(e) {
            console.log('Minimize button clicked');
            e.preventDefault();
            e.stopPropagation();
            window.electronAPI.minimizeWindow();
        });
    }

    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', function(e) {
            console.log('Maximize button clicked');
            e.preventDefault();
            e.stopPropagation();
            window.electronAPI.maximizeWindow();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            console.log('Close button clicked');
            e.preventDefault();
            e.stopPropagation();
            window.electronAPI.closeWindow();
        });
    }

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
            
            // Apply constraints - updated minimum to 200px
            if (newWidth >= 200 && newWidth <= 800) {
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

    // Initialize PDF tabs
    loadSavedPDFs();
    
    // Add file input change handler for new PDFs
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const files = e.target.files;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.type === 'application/pdf') {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const pdfData = {
                            name: file.name,
                            data: e.target.result
                        };
                        // Add to saved PDFs
                        const savedPDFs = JSON.parse(localStorage.getItem('savedPDFs') || '[]');
                        savedPDFs.push(pdfData);
                        localStorage.setItem('savedPDFs', JSON.stringify(savedPDFs));
                        
                        // Add tab and load PDF
                        addPdfTab(file.name, e.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            }
        });
    }

    // New Note Functionality
    initializeNewNoteHandlers();

    // Directory selection - Single implementation
    const selectDirectoryBtn = document.getElementById('selectDirectoryBtn');
    const currentDirectorySpan = document.getElementById('currentDirectory');
    
    if (selectDirectoryBtn) {
        // Remove any existing listeners
        selectDirectoryBtn.replaceWith(selectDirectoryBtn.cloneNode(true));
        
        // Get the fresh reference
        const newSelectDirectoryBtn = document.getElementById('selectDirectoryBtn');
        
        // Add single event listener
        newSelectDirectoryBtn.addEventListener('click', async () => {
            console.log('Select directory clicked'); // Debug log
            try {
                const dirPath = await window.electronAPI.selectDirectory();
                if (dirPath) {
                    console.log('Directory selected:', dirPath); // Debug log
                    localStorage.setItem('selectedDirectory', dirPath);
                    currentDirectorySpan.textContent = dirPath;
                    await loadFilesFromDirectory(dirPath);
                }
            } catch (error) {
                console.error('Error selecting directory:', error);
            }
        });
    }
    
    // Load previously selected directory
    const savedDirectory = localStorage.getItem('selectedDirectory');
    if (savedDirectory) {
        currentDirectorySpan.textContent = savedDirectory;
        loadFilesFromDirectory(savedDirectory);
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

    // Disable Popups
    const savedDisablePopups = localStorage.getItem('disablePopups') === 'true';
    const disablePopupsToggle = document.getElementById('disablePopups');
    if (disablePopupsToggle) {
        disablePopupsToggle.checked = savedDisablePopups;
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

    // Disable Popups
    const disablePopupsToggle = document.getElementById('disablePopups');
    if (disablePopupsToggle) {
        disablePopupsToggle.addEventListener('change', function() {
            localStorage.setItem('disablePopups', this.checked);
        });
    }
}

// Helper function to check if popups are disabled
function arePopupsDisabled() {
    return localStorage.getItem('disablePopups') === 'true';
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSettings();
    setupSettingsHandlers();
    initializeNewNoteHandlers();
    
    // Rest of your existing DOMContentLoaded code...
});

// PDF management
let pdfs = [];
let currentPdfIndex = -1;
let currentScale = 1.0;

// Load saved PDFs function
function loadSavedPDFs() {
    const savedPDFs = JSON.parse(localStorage.getItem('savedPDFs') || '[]');
    
    // Clear existing PDFs array and tabs
    pdfs = [];
    const pdfFiles = document.getElementById('pdfFiles');
    if (pdfFiles) {
        pdfFiles.innerHTML = '';
    }
    
    // Add each saved PDF as a tab
    savedPDFs.forEach((pdfData, index) => {
        addPdfTab(pdfData.name || `PDF ${index + 1}`, pdfData.data);
    });
    
    // Switch to first PDF if available
    if (savedPDFs.length > 0) {
        switchToPdf(0);
    }
}

// Update PDF management functions
function addPdfTab(name, data) {
    return new Promise((resolve) => {
        const pdfFiles = document.getElementById('pdfFiles');
        if (!pdfFiles) return resolve(null);
        
        const tab = document.createElement('div');
        tab.className = 'pdf-file-tab';
        tab.dataset.index = pdfs.length;
        
        const content = document.createElement('span');
        content.className = 'tab-content';
        content.textContent = name;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'tab-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        tab.appendChild(content);
        tab.appendChild(closeBtn);
        pdfFiles.appendChild(tab);
        
        // Store PDF data
        pdfs.push({ name, data });
        
        // Event listeners
        tab.addEventListener('click', (e) => {
            if (e.target.closest('.tab-close')) return;
            const index = parseInt(tab.dataset.index);
            switchToPdf(index);
        });
        
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(tab.dataset.index);
            closePdf(index);
        });
        
        resolve(tab);
    });
}

function closePdf(index) {
    // Remove the PDF from the array
    pdfs.splice(index, 1); // Fixed: Changed from splice(index, 0) to splice(index, 1)
    
    // Update localStorage
    localStorage.setItem('savedPDFs', JSON.stringify(pdfs));
    
    // Remove the tab
    const tabs = document.querySelectorAll('.pdf-file-tab');
    tabs[index].remove();
    
    // Update remaining tabs' indices
    tabs.forEach((tab, i) => {
        if (i > index) {
            tab.dataset.index = i - 1;
        }
    });
    
    // Switch to another PDF if necessary
    if (currentPdfIndex === index) {
        if (index > 0) {
            switchToPdf(index - 1);
        } else if (pdfs.length > 0) {
            switchToPdf(0);
        } else {
            // No PDFs left
            currentPdfIndex = -1;
            document.querySelector('.pdf-viewer').innerHTML = '';
        }
    } else if (currentPdfIndex > index) {
        currentPdfIndex--;
    }
}

function switchToPdf(index) {
    if (index === currentPdfIndex) return;
    
    // Update tabs
    document.querySelectorAll('.pdf-file-tab').forEach(tab => {
        tab.classList.toggle('active', parseInt(tab.dataset.index) === index);
    });
    
    currentPdfIndex = index;
    const pdf = pdfs[index];
    
    // Load the PDF
    if (pdf && pdf.data) {
        loadPdf(pdf.data).catch(error => {
            console.error('Error switching PDF:', error);
        });
    }
}

async function loadPdf(data) {
    const viewer = document.getElementById('pdfViewer');
    if (!viewer) return;
    
    try {
        let pdfData = data;
        let url;

        if (typeof data === 'string' && data.startsWith('data:')) {
            // Data is already a data URL, use it directly
            url = data;
        } else {
            // Convert to blob if it's binary data
            const blob = new Blob([pdfData], { type: 'application/pdf' });
            url = URL.createObjectURL(blob);
        }

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        currentPDF = pdf;

        // Clear the viewer and create container
        viewer.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'pdfViewerCanvas';
        viewer.appendChild(container);

        // Get total pages
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

        // Apply current zoom if needed
        if (currentScale && currentScale !== 1.0) {
            updateZoom(currentScale);
        }

        // Clean up blob URL if we created one
        if (url !== data) {
            URL.revokeObjectURL(url);
        }

    } catch (error) {
        console.error('Error loading PDF:', error);
        viewer.innerHTML = '<div class="error-message">Error loading PDF: ' + error.message + '</div>';
    }
}

// Add keyboard shortcuts for switching PDFs
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                // Switch to previous PDF
                if (currentPdfIndex > 0) {
                    switchToPdf(currentPdfIndex - 1);
                }
            } else {
                // Switch to next PDF
                if (currentPdfIndex < pdfs.length - 1) {
                    switchToPdf(currentPdfIndex + 1);
                }
            }
        }
    }
});

// New Note Functionality
function initializeNewNoteHandlers() {
    const newNoteBtn = document.querySelector('.new-note-btn');
    const dropZone = document.querySelector('.drop-zone');
    const fileInput = document.getElementById('noteFiles');
    const filesList = document.getElementById('selectedNoteFiles');
    const noteForm = document.getElementById('newNoteForm');

    // Open new note modal when clicking the new note button
    if (newNoteBtn) {
        newNoteBtn.addEventListener('click', () => {
            openModal('newNoteModal');
            // Clear form when opening
            noteForm.reset();
            
            // Clear file list
            const fileList = document.getElementById('fileList');
            if (fileList) {
                fileList.innerHTML = '';
            }
        });
    }

    // Handle drop zone click
    if (dropZone) {
        // Prevent the click on the input from bubbling to the drop zone
        fileInput.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Handle drop zone click
        dropZone.addEventListener('click', function(e) {
            fileInput.click();
        });

        // Handle drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drop-zone-active');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drop-zone-active');
            });
        });

        dropZone.addEventListener('drop', handleDrop);
    }

    // Handle file selection through input
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFiles(Array.from(e.target.files));
        });
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = Array.from(dt.files);
        handleFiles(files);
    }

    function handleFiles(files) {
        if (!filesList) return;

        files.forEach(file => {
            // Check if file is already in the list
            const existingFiles = Array.from(filesList.children);
            const isDuplicate = existingFiles.some(item => {
                const fileName = item.querySelector('span').textContent;
                return fileName === file.name;
            });

            if (!isDuplicate) {
                // If it's a PDF, store it in localStorage immediately
                if (file.type === 'application/pdf') {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const pdfData = {
                            name: file.name,
                            data: e.target.result
                        };
                        
                        // Add to saved PDFs if not already present
                        const savedPDFs = JSON.parse(localStorage.getItem('savedPDFs') || '[]');
                        if (!savedPDFs.some(pdf => pdf.name === file.name)) {
                            savedPDFs.push(pdfData);
                            localStorage.setItem('savedPDFs', JSON.stringify(savedPDFs));
                        }
                    };
                    reader.readAsDataURL(file);
                }
                
                const item = createFileListItem(file);
                filesList.appendChild(item);
            }
        });
    }

    function createFileListItem(file) {
        const item = document.createElement('li');
        item.className = 'file-item';
        
        // Add appropriate class based on file type
        if (file.type.includes('pdf')) {
            item.classList.add('pdf');
        } else if (file.type.includes('image')) {
            item.classList.add('image');
        } else {
            item.classList.add('document');
        }
        
        // Add file icon based on type
        const icon = document.createElement('i');
        icon.className = 'file-icon fas ' + getFileIcon(file);
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = file.name;
        nameSpan.title = file.name; // Add tooltip
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = 'Remove file';
        
        // Add click handler to open file
        nameSpan.addEventListener('click', () => {
            openFile(file);
        });
        
        // Remove file handler
        removeBtn.addEventListener('click', () => {
            item.remove();
        });
        
        item.appendChild(icon);
        item.appendChild(nameSpan);
        item.appendChild(removeBtn);
        
        return item;
    }

    function getFileIcon(file) {
        if (file.type.includes('pdf')) {
            return 'fa-file-pdf';
        } else if (file.type.includes('image')) {
            return 'fa-file-image';
        } else if (file.type.includes('word') || file.type.includes('document')) {
            return 'fa-file-word';
        } else if (file.type.includes('text')) {
            return 'fa-file-alt';
        }
        return 'fa-file';
    }

    function openFile(file) {
        if (file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = function(e) {
                const pdfData = {
                    name: file.name,
                    data: e.target.result
                };
                
                // Add to saved PDFs
                const savedPDFs = JSON.parse(localStorage.getItem('savedPDFs') || '[]');
                savedPDFs.push(pdfData);
                localStorage.setItem('savedPDFs', JSON.stringify(savedPDFs));
                
                // Add tab and load PDF
                addPdfTab(file.name, e.target.result);
                
                // Switch to the new PDF
                switchToPdf(pdfs.length - 1);
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('image/')) {
            // Handle image preview in a modal or viewer
            const reader = new FileReader();
            reader.onload = function(e) {
                // You can implement image viewing functionality here
                console.log('Image loaded:', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }
}

// Create new note function
function createNewNote() {
    const noteName = document.getElementById('noteName').value.trim();
    const filesList = document.getElementById('selectedNoteFiles');
    const files = Array.from(filesList?.children || []).map(li => {
        const fileName = li.querySelector('span').textContent;
        return {
            name: fileName,
            type: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'file'
        };
    });
    
    if (!noteName) {
        alert('Please enter a note name');
        return;
    }
    
    const newFile = {
        type: 'file',
        name: noteName + '.md',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        id: Date.now(),
        isNote: true,
        files: files
    };

    // Add to file system
    if (!fileSystem.children) {
        fileSystem.children = [];
    }
    fileSystem.children.push(newFile);
    
    // Save to both file system and notes storage
    saveFileSystem();
    
    // Save note with files
    const note = {
        id: newFile.id,
        name: newFile.name,
        created: newFile.created,
        modified: newFile.modified,
        files: files
    };
    
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push(note);
    localStorage.setItem('notes', JSON.stringify(notes));
    
    // Refresh the file tree
    refreshFileTree();
    
    // Open the note to display its PDFs
    openNote(note);
    
    // Close modal and reset form
    closeModal('newNoteModal');
    document.getElementById('newNoteForm').reset();
    if (filesList) {
    filesList.innerHTML = '';
    }
}

function openNote(note) {
    // Get saved PDFs from localStorage
    const savedPDFs = JSON.parse(localStorage.getItem('savedPDFs') || '[]');

    // Clear existing PDF tabs and viewer
    const pdfFiles = document.getElementById('pdfFiles');
    if (pdfFiles) {
        pdfFiles.innerHTML = '';
    }
    const pdfViewer = document.getElementById('pdfViewer');
    if (pdfViewer) {
        pdfViewer.innerHTML = '';
    }
    
    pdfs = []; // Reset pdfs array
    currentPdfIndex = -1;

    // Open associated files
    const pdfPromises = note.files.map(file => {
        if (file.type === 'pdf') {
            // Find the PDF data in localStorage
            const pdfData = savedPDFs.find(pdf => pdf.name === file.name);
            if (pdfData) {
                return addPdfTab(file.name, pdfData.data);
            }
        }
        return null;
    }).filter(Boolean);

    // Wait for all PDFs to be added
    Promise.all(pdfPromises).then(() => {
        // Switch to the first PDF if available
        if (pdfs.length > 0) {
            switchToPdf(0);
        }
    });

    // Highlight the selected note in the file tree
    document.querySelectorAll('.tree-item-content').forEach(item => {
        item.classList.remove('active');
        if (item.querySelector('.tree-item-text').textContent === note.name) {
            item.classList.add('active');
        }
    });
}

// File Tree functionality
let fileSystem = {
    type: 'folder',
    name: 'root',
    children: []
};

let currentSortMethod = 'name';
let sortDirection = 'asc';

function toggleSortMenu(event) {
    event.stopPropagation();
    const sortMenu = document.getElementById('sortMenu');
    sortMenu.classList.toggle('active');

    // Close menu when clicking outside
    const closeMenu = (e) => {
        if (!sortMenu.contains(e.target) && !event.target.contains(e.target)) {
            sortMenu.classList.remove('active');
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 0);
}

function sortFiles(method) {
    if (currentSortMethod === method) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortMethod = method;
        sortDirection = 'asc';
    }

    // Sort the file system
    sortFileSystemRecursive(fileSystem);
    
    // Refresh the tree view
    const treeContent = document.getElementById('fileTree');
    treeContent.innerHTML = '';
    fileSystem.children.forEach(item => {
        treeContent.appendChild(createTreeItem(item));
    });

    // Save the sorted file system
    saveFileSystem();

    // Close the sort menu
    document.getElementById('sortMenu').classList.remove('active');
}

function sortFileSystemRecursive(folder) {
    if (!folder.children) return;

    folder.children.sort((a, b) => {
        // Folders always come first
        if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
        }

        let comparison = 0;
        switch (currentSortMethod) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'modified':
                comparison = new Date(b.modified) - new Date(a.modified);
                break;
            case 'created':
                comparison = new Date(b.created) - new Date(a.created);
                break;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Sort children recursively
    folder.children.forEach(item => {
        if (item.type === 'folder') {
            sortFileSystemRecursive(item);
        }
    });
}

function createTreeItem(file) {
    const item = document.createElement('div');
    item.className = 'tree-item';
    if (file.isDirectory) {
        item.classList.add('folder');
    }

    const content = document.createElement('div');
    content.className = 'tree-item-content';
    
    if (file.isDirectory) {
        const toggle = document.createElement('span');
        toggle.className = 'tree-item-toggle';
        toggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
        content.appendChild(toggle);
    } else {
        // Add spacing for files to align with folders
        const spacer = document.createElement('span');
        spacer.className = 'tree-item-toggle';
        spacer.style.visibility = 'hidden';
        content.appendChild(spacer);
    }

    const icon = document.createElement('span');
    icon.className = 'tree-item-icon';
    icon.innerHTML = getFileIcon(file);
    
    const text = document.createElement('span');
    text.className = 'tree-item-text';
    text.textContent = file.name;

    content.appendChild(icon);
    content.appendChild(text);
    item.appendChild(content);
    
    // Add click handler
    content.addEventListener('click', async (e) => {
        if (file.isDirectory) {
            const wasExpanded = item.classList.contains('expanded');
            item.classList.toggle('expanded');
            
            // Update folder icon
                const folderIcon = icon.querySelector('i');
            folderIcon.className = item.classList.contains('expanded') ? 
                'fas fa-folder-open' : 
                'fas fa-folder';
            
            // Load subdirectory contents if not already loaded
            if (!wasExpanded && !item.querySelector('.tree-item-children')) {
                await loadSubdirectory(item, file.path);
        }
    } else {
            handleFileClick(file);
        }
    });
    
                return item;
}

function getFileIcon(file) {
    if (file.isDirectory) {
        return '<i class="fas fa-folder"></i>';
    }
    
    const extension = file.name.split('.').pop().toLowerCase();
    switch (extension) {
        case 'pdf':
            return '<i class="fas fa-file-pdf"></i>';
        case 'md':
            return '<i class="fas fa-file-alt"></i>';
        case 'txt':
            return '<i class="fas fa-file-text"></i>';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return '<i class="fas fa-file-image"></i>';
        default:
            return '<i class="fas fa-file"></i>';
    }
}

async function loadSubdirectory(parentElement, dirPath) {
    try {
        const files = await window.electronAPI.readDirectory(dirPath);
        
        const children = document.createElement('div');
        children.className = 'tree-item-children';
        
        files.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });
        
        files.forEach(file => {
            const item = createTreeItem(file);
            children.appendChild(item);
        });
        
        parentElement.appendChild(children);
    } catch (error) {
        console.error('Error loading subdirectory:', error);
    }
}

async function handleFileClick(file) {
    console.log('Opening file:', file.path);
    try {
        const extension = file.name.split('.').pop().toLowerCase();
        
        // Get or create the main viewer section
        let viewerSection = document.querySelector('.pdf-section');
        if (!viewerSection) {
            viewerSection = document.createElement('div');
            viewerSection.className = 'pdf-section';
            document.querySelector('.main-content').appendChild(viewerSection);
        }
        
        // Clear the viewer section
        viewerSection.innerHTML = '';
        
        switch (extension) {
            case 'pdf':
                await loadPDFFile(file, viewerSection);
                break;
                
            case 'md':
                await loadMarkdownFile(file, viewerSection);
                break;
                
            default:
                const success = await window.electronAPI.openFile(file.path);
                if (!success) {
                    console.error('Failed to open file:', file.path);
                }
        }
    } catch (error) {
        console.error('Error handling file click:', error);
    }
}

async function loadPDFFile(file, container) {
    try {
        // Create PDF viewer container
        const pdfViewer = document.createElement('div');
        pdfViewer.id = 'pdfViewer';
        pdfViewer.className = 'pdf-viewer';
        container.appendChild(pdfViewer);

        // Load the PDF using pdf.js
        const loadingTask = pdfjsLib.getDocument(file.path);
        loadingTask.promise.then(function(pdf) {
            console.log('PDF loaded');
            
            // Store the current PDF
            currentPDF = pdf;
            
            // Load all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                pdf.getPage(pageNum).then(function(page) {
                    const scale = 1.5;
                    const viewport = page.getViewport({ scale: scale });

                    // Prepare canvas for this page
                    const pageContainer = document.createElement('div');
                    pageContainer.className = 'pdf-page-container';
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    pageContainer.appendChild(canvas);
                    pdfViewer.appendChild(pageContainer);

                    // Render PDF page into canvas context
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    page.render(renderContext);
                });
            }
        }).catch(function(error) {
            console.error('Error loading PDF:', error);
        });
    } catch (error) {
        console.error('Error loading PDF file:', error);
    }
}

async function loadMarkdownFile(file, container) {
    try {
        // Create editor container with split view
        const editorContainer = document.createElement('div');
        editorContainer.id = 'markdownEditor';
        editorContainer.className = 'markdown-editor-container';
        container.appendChild(editorContainer);

        // Create left panel for editing
        const editorPanel = document.createElement('div');
        editorPanel.className = 'editor-panel';
        
        // Create textarea for editing
        const editor = document.createElement('textarea');
        editor.className = 'markdown-editor';
        editor.dataset.filePath = file.path;
        editorPanel.appendChild(editor);
        
        // Create right panel for preview
        const previewPanel = document.createElement('div');
        previewPanel.className = 'preview-panel';
        previewPanel.innerHTML = '<div class="markdown-preview"></div>';
        
        // Add panels to container
        editorContainer.appendChild(editorPanel);
        editorContainer.appendChild(previewPanel);

        // Read and set file content
        const content = await window.electronAPI.readFile(file.path);
        editor.value = content;
        
        // Initial preview render
        updatePreview(editor.value, file.path);

        // Set up real-time preview
        editor.addEventListener('input', (e) => {
            updatePreview(e.target.value, file.path);
        });

        // Auto-save with debouncing
        editor.addEventListener('input', debounce(async () => {
            try {
                await window.electronAPI.writeFile(file.path, editor.value);
                console.log('File saved');
            } catch (error) {
                console.error('Error saving file:', error);
            }
        }, 1000));

    } catch (error) {
        console.error('Error loading markdown file:', error);
    }
}

async function updatePreview(markdown, filePath) {
    const previewElement = document.querySelector('.markdown-preview');
    if (!previewElement) {
        console.error('Preview element not found');
        return;
    }

    console.log('Updating preview with:', {
        markdown: markdown,
        filePath: filePath
    });

    try {
        // Convert markdown using Python
        console.log('Calling convertMarkdown...');
        const html = await window.electronAPI.convertMarkdown(markdown, filePath);
        console.log('Received HTML:', html);

        if (!html) {
            console.error('No HTML content received from converter');
            previewElement.innerHTML = '<div class="error">No content received from markdown converter</div>';
            return;
        }

        // Update the preview
        previewElement.innerHTML = html;
        console.log('Preview updated');

        // Add error handling for images
        previewElement.querySelectorAll('img').forEach(img => {
            console.log('Processing image:', img.src);
            
            // Create a wrapper div for the image and error message
            const wrapper = document.createElement('div');
            wrapper.className = 'image-wrapper';
            img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(img);

            // Add loading indicator
            img.style.opacity = '0.5';
            const loading = document.createElement('div');
            loading.className = 'image-loading';
            loading.textContent = 'Loading image...';
            wrapper.appendChild(loading);

            // Handle successful load
            img.onload = function() {
                console.log('Image loaded successfully:', img.src);
                img.style.opacity = '1';
                loading.remove();
            };

            // Handle load error
            img.onerror = async function() {
                console.error('Image load error:', img.src);
                loading.remove();
                const decodedSrc = decodeURIComponent(img.src.replace('file:///', ''));
                
                // Try to verify file existence
                const exists = await window.electronAPI.fileExists(decodedSrc);
                console.log('File exists check:', {
                    path: decodedSrc,
                    exists: exists
                });

                // Show error message
                const errorMsg = document.createElement('div');
                errorMsg.className = 'image-error';
                errorMsg.innerHTML = `
                    <div style="color: red; font-size: 12px; margin-top: 5px;">
                        Failed to load image: ${decodedSrc.split('/').pop()}<br>
                        Path: ${decodedSrc}<br>
                        File exists: ${exists ? 'Yes' : 'No'}
                    </div>
                `;
                wrapper.appendChild(errorMsg);
            };
        });
    } catch (error) {
        console.error('Error in updatePreview:', error);
        previewElement.innerHTML = `
            <div class="error">
                Error converting markdown: ${error.message}<br>
                Stack: ${error.stack}
            </div>
        `;
    }
}

// Add directory selection event listener
document.addEventListener('DOMContentLoaded', function() {
    const selectDirectoryBtn = document.getElementById('selectDirectoryBtn');
    const currentDirectorySpan = document.getElementById('currentDirectory');
    
    if (selectDirectoryBtn) {
        // Remove any existing listeners
        selectDirectoryBtn.replaceWith(selectDirectoryBtn.cloneNode(true));
        
        // Get the fresh reference
        const newSelectDirectoryBtn = document.getElementById('selectDirectoryBtn');
        
        // Add single event listener
        newSelectDirectoryBtn.addEventListener('click', async () => {
            console.log('Select directory clicked'); // Debug log
            try {
                const dirPath = await window.electronAPI.selectDirectory();
                if (dirPath) {
                    console.log('Directory selected:', dirPath); // Debug log
                    localStorage.setItem('selectedDirectory', dirPath);
                    currentDirectorySpan.textContent = dirPath;
                    await loadFilesFromDirectory(dirPath);
                }
            } catch (error) {
                console.error('Error selecting directory:', error);
            }
        });
    }
    
    // Load previously selected directory
    const savedDirectory = localStorage.getItem('selectedDirectory');
    if (savedDirectory) {
        currentDirectorySpan.textContent = savedDirectory;
        loadFilesFromDirectory(savedDirectory);
    }
});

function handleRootDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Only show drop indicator if we're directly over the file tree content
    // and not over any of its children
    if (e.target.id === 'fileTree') {
        e.target.classList.add('drag-over');
    }
    e.dataTransfer.dropEffect = 'move';
}

function handleRootDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Only remove drop indicator if we're leaving the file tree content
    if (e.target.id === 'fileTree') {
        e.target.classList.remove('drag-over');
    }
}

function handleRootDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove drop indicator
    e.target.classList.remove('drag-over');
    
    // Only process drop if we're directly on the file tree content
    if (e.target.id !== 'fileTree') return;
    
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    const draggedId = data.id;
    const draggedType = data.type;
    
    let draggedItem;
    if (draggedType === 'folder') {
        draggedItem = findFolderByName(draggedId.replace('folder-', ''));
    } else {
        draggedItem = findItemById(draggedId);
    }
    
    if (draggedItem) {
        // Remove item from its current location
        removeItemFromFileSystem(draggedItem);
        
        // Add item to root level
        fileSystem.children.push(draggedItem);
        
        // Save changes and refresh tree
        saveFileSystem();
        refreshFileTree();
    }
}

function findItemById(id) {
    function search(items) {
        for (const item of items) {
            if (item.id === parseInt(id)) {
                return item;
            }
            if (item.children) {
                const found = search(item.children);
                if (found) return found;
            }
        }
        return null;
    }
    return search(fileSystem.children);
}

function removeItemFromFileSystem(item) {
    function removeFromParent(items) {
        for (let i = 0; i < items.length; i++) {
            if (items[i] === item) {
                items.splice(i, 1);
                return true;
            }
            if (items[i].children) {
                if (removeFromParent(items[i].children)) {
                    return true;
                }
            }
        }
        return false;
    }
    removeFromParent(fileSystem.children);
}

let sourceDirectory = null;

// Add near the beginning of the file
async function initializeApp() {
    // ... existing initialization code ...
    
    // Request folder access on startup if not already selected
    if (!sourceDirectory) {
        await selectDirectory();
    }
    
    loadNotesFromDirectory();
}

async function selectDirectory() {
    try {
        const dirHandle = await window.showDirectoryPicker();
        sourceDirectory = dirHandle;
        localStorage.setItem('lastDirectoryHandle', JSON.stringify(await dirHandle.serialize()));
        document.getElementById('currentDirectory').textContent = dirHandle.name;
        await loadNotesFromDirectory();
    } catch (err) {
        console.error('Error selecting directory:', err);
    }
}

async function loadNotesFromDirectory() {
    if (!sourceDirectory) return;
    
    clearNotesList();
    
    try {
        for await (const entry of sourceDirectory.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.md')) {
                const file = await entry.getFile();
                const content = await file.text();
                const note = {
                    id: entry.name.replace('.md', ''),
                    title: entry.name.replace('.md', ''),
                    content: content,
                    lastModified: file.lastModified
                };
                addNoteToList(note);
            }
        }
    } catch (err) {
        console.error('Error loading notes:', err);
    }
}

// Modify the existing saveNote function
async function saveNote(note) {
    if (!sourceDirectory) {
        console.error('No directory selected');
        return;
    }

    try {
        const fileName = `${note.title}.md`;
        const fileHandle = await sourceDirectory.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(note.content);
        await writable.close();
    } catch (err) {
        console.error('Error saving note:', err);
    }
}

// Modify the existing deleteNote function
async function deleteNote(noteId) {
    if (!sourceDirectory) {
        console.error('No directory selected');
        return;
    }

    try {
        await sourceDirectory.removeEntry(`${noteId}.md`);
        // ... existing delete note UI code ...
    } catch (err) {
        console.error('Error deleting note:', err);
    }
}

// Add event listeners in your initialization code
document.getElementById('selectDirectoryBtn').addEventListener('click', selectDirectory);

// ... existing code ... 

async function loadFilesFromDirectory(dirPath) {
    try {
        const fileTree = document.getElementById('fileTree');
        if (!fileTree) return;
        
        fileTree.innerHTML = '';
        console.log('Loading directory:', dirPath);
        
        const files = await window.electronAPI.readDirectory(dirPath);
        if (!files || !Array.isArray(files)) {
            console.error('No files returned or invalid response');
            return;
        }
        
        console.log('Files loaded:', files);
        
        // Sort files (folders first, then alphabetically)
        files.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });
        
        // Create file tree items
        files.forEach(file => {
            const item = createTreeItem(file);
            fileTree.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

// Add this function to help debug image paths
async function testImagePath(imagePath) {
    try {
        // Try to read the file to verify it exists
        await window.electronAPI.readFile(imagePath);
        console.log('Image exists:', imagePath);
        return true;
    } catch (error) {
        console.error('Image not found:', imagePath);
        return false;
    }
} 