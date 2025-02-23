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
        icon.className = 'file-icon fas ' + getFileIcon(file.type);
        
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

    function getFileIcon(fileType) {
        if (fileType.includes('pdf')) {
            return 'fa-file-pdf';
        } else if (fileType.includes('image')) {
            return 'fa-file-image';
        } else if (fileType.includes('word') || fileType.includes('document')) {
            return 'fa-file-word';
        } else if (fileType.includes('text')) {
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

function createTreeItem(item) {
    const treeItem = document.createElement('div');
    treeItem.className = 'tree-item';
    if (item.type === 'folder') {
        treeItem.classList.add('folder');
    }

    const content = document.createElement('div');
    content.className = 'tree-item-content';
    
    // Make notes and folders draggable
    if (item.isNote || item.type === 'folder') {
        content.draggable = true;
        content.dataset.itemId = item.id || `folder-${item.name}`; // Use name for folders if no id
        content.dataset.itemType = item.type;
        
        // Add drag event listeners
        content.addEventListener('dragstart', handleDragStart);
        content.addEventListener('dragend', handleDragEnd);
    }
    
    // Add drop event listeners for folders
    if (item.type === 'folder') {
        content.addEventListener('dragover', handleDragOver);
        content.addEventListener('dragleave', handleDragLeave);
        content.addEventListener('drop', handleDrop);
    }

    if (item.type === 'folder') {
        const toggle = document.createElement('span');
        toggle.className = 'tree-item-toggle';
        toggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
        content.appendChild(toggle);
    }

    const icon = document.createElement('span');
    icon.className = 'tree-item-icon';
    icon.innerHTML = item.type === 'folder' 
        ? '<i class="fas fa-folder"></i>' 
        : '<i class="fas fa-file-alt"></i>';
    
    const text = document.createElement('span');
    text.className = 'tree-item-text';
    text.textContent = item.name;

    content.appendChild(icon);
    content.appendChild(text);
    treeItem.appendChild(content);

    if (item.type === 'folder') {
        const children = document.createElement('div');
        children.className = 'tree-item-children';
        if (item.children) {
            item.children.forEach(child => {
                children.appendChild(createTreeItem(child));
            });
        }
        treeItem.appendChild(children);

        // Handle folder click for the entire content area
        content.addEventListener('click', (e) => {
            // Don't toggle if clicking on context menu, if we're dragging, or if we're dropping
            if (!e.target.closest('.context-menu') && 
                !content.classList.contains('dragging') && 
                !content.classList.contains('drag-over')) {
                treeItem.classList.toggle('expanded');
                const folderIcon = icon.querySelector('i');
                if (treeItem.classList.contains('expanded')) {
                    folderIcon.className = 'fas fa-folder-open';
                } else {
                    folderIcon.className = 'fas fa-folder';
                }
            }
        });
    } else {
        // Handle file click
        content.addEventListener('click', () => {
            document.querySelectorAll('.tree-item-content.active').forEach(el => {
                el.classList.remove('active');
            });
            content.classList.add('active');
            openFile(item);
        });
    }

    // Context menu
    content.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, item, treeItem);
    });

    return treeItem;
}

function handleDragStart(e) {
        e.stopPropagation();
    const itemType = e.target.dataset.itemType;
    
    // Don't allow dragging if we're interacting with the toggle or context menu
    if (e.target.closest('.tree-item-toggle') || e.target.closest('.context-menu')) {
        e.preventDefault();
        return;
    }
    
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.dataset.itemId);
    e.dataTransfer.setData('application/json', JSON.stringify({
        id: e.target.dataset.itemId,
        type: itemType
    }));
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.stopPropagation();
    e.target.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!e.target.closest('.tree-item-content').classList.contains('drag-over')) {
        e.target.closest('.tree-item-content').classList.add('drag-over');
    }
    e.dataTransfer.dropEffect = 'move';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.target.closest('.tree-item-content').classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const targetFolder = e.target.closest('.tree-item-content');
    targetFolder.classList.remove('drag-over');
    
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    const draggedId = data.id;
    const draggedType = data.type;
    
    // Don't allow dropping onto itself
    if (targetFolder.dataset.itemId === draggedId) {
        return;
    }
    
    let draggedItem;
    if (draggedType === 'folder') {
        draggedItem = findFolderByName(draggedId.replace('folder-', ''));
        
        // Check if target is a descendant of the dragged folder
        if (isDescendant(draggedItem, targetFolder.dataset.itemId)) {
            return;
        }
    } else {
        draggedItem = findItemById(draggedId);
    }
    
    const targetFolderItem = findItemByElement(targetFolder.closest('.tree-item'));
    
    if (draggedItem && targetFolderItem) {
        // Create a deep copy of the dragged item
        const draggedItemCopy = JSON.parse(JSON.stringify(draggedItem));
        
        // First remove the item from its current location
        removeItemFromFileSystem(draggedItem);
        
        // Then add the copy to the target folder
        if (!targetFolderItem.children) {
            targetFolderItem.children = [];
        }
        targetFolderItem.children.push(draggedItemCopy);
        
        // Save changes
        saveFileSystem();
        
        // Store the expanded state of all folders before refresh
        const expandedFolders = new Set();
        document.querySelectorAll('.tree-item.expanded').forEach(folder => {
            const folderName = folder.querySelector('.tree-item-text').textContent;
            expandedFolders.add(folderName);
        });
        
        // Add the target folder to the expanded folders set to ensure it stays open
        const targetFolderName = targetFolder.querySelector('.tree-item-text').textContent;
        expandedFolders.add(targetFolderName);
        
        // Refresh the entire file tree
        refreshFileTree();
        
        // Restore expanded state of all folders
        expandedFolders.forEach(folderName => {
            const folder = Array.from(document.querySelectorAll('.tree-item-text')).find(el => el.textContent === folderName)?.closest('.tree-item');
            if (folder) {
                folder.classList.add('expanded');
                const folderIcon = folder.querySelector('.tree-item-icon i');
                if (folderIcon) {
                    folderIcon.className = 'fas fa-folder-open';
                }
            }
        });
    }
    
    // Prevent the click event from firing
    e.stopImmediatePropagation();
    return false;
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

function findFolderByName(name) {
    function search(items) {
        for (const item of items) {
            if (item.type === 'folder' && item.name === name) {
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

function isDescendant(folder, targetId) {
    if (!folder.children) return false;
    
    for (const child of folder.children) {
        if (child.type === 'folder') {
            const childId = `folder-${child.name}`;
            if (childId === targetId || isDescendant(child, targetId)) {
                return true;
            }
        }
    }
    return false;
}

function showContextMenu(e, item, treeItem) {
    const existing = document.querySelector('.context-menu');
    if (existing) {
        existing.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.top = `${e.pageY}px`;
    menu.style.left = `${e.pageX}px`;

    const menuItems = [];

    if (item.type === 'folder') {
        menuItems.push({
            icon: 'fa-file',
            text: 'New File',
            action: () => createNewFile(item, treeItem)
        });
        menuItems.push({
            icon: 'fa-folder-plus',
            text: 'New Folder',
            action: () => createNewFolder(item, treeItem)
        });
    }

    menuItems.push({
        icon: 'fa-edit',
        text: 'Rename',
        action: () => renameItem(item, treeItem)
    });
    menuItems.push({
        icon: 'fa-trash',
        text: 'Delete',
        action: () => deleteItem(item, treeItem)
    });

    menuItems.forEach((menuItem, index) => {
        if (index > 0) {
            const separator = document.createElement('div');
            separator.className = 'context-menu-separator';
            menu.appendChild(separator);
        }

        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.innerHTML = `
            <i class="fas ${menuItem.icon}"></i>
            <span>${menuItem.text}</span>
        `;
        item.addEventListener('click', () => {
            menuItem.action();
            menu.remove();
        });
        menu.appendChild(item);
    });

    document.body.appendChild(menu);

    // Close menu when clicking outside
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
            setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 0);
}

function createNewFile(parentItem, parentElement) {
    const name = prompt('Enter note name:');
    if (!name) return;

    // Store expanded folders state
    const expandedFolders = new Set();
    document.querySelectorAll('.tree-item.expanded').forEach(folder => {
        const folderName = folder.querySelector('.tree-item-text').textContent;
        expandedFolders.add(folderName);
    });

    const newFile = {
        type: 'file',
        name: name + '.md', // Add .md extension for markdown files
        content: '',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        id: Date.now(), // Add unique ID for the note
        isNote: true
    };

    // Add to parent's children
    if (!parentItem.children) {
        parentItem.children = [];
    }
    parentItem.children.push(newFile);
    
    // Save to both file system and notes storage
    saveFileSystem();
    saveNote(newFile);

    // Add parent folder to expanded folders if it exists
    if (parentItem.name) {
        expandedFolders.add(parentItem.name);
    }

    // Refresh the entire tree to ensure proper rendering
    refreshFileTree();

    // Restore expanded state
    expandedFolders.forEach(folderName => {
        const folder = Array.from(document.querySelectorAll('.tree-item-text')).find(el => el.textContent === folderName)?.closest('.tree-item');
        if (folder) {
            folder.classList.add('expanded');
            const folderIcon = folder.querySelector('.tree-item-icon i');
            if (folderIcon) {
                folderIcon.className = 'fas fa-folder-open';
            }
        }
    });
}

function saveNote(note) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push({
        id: note.id,
        name: note.name,
        content: note.content,
        created: note.created,
        modified: note.modified,
        files: []
    });
    localStorage.setItem('notes', JSON.stringify(notes));
}

function openFile(item) {
    if (item.isNote) {
        // Handle note opening
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const note = notes.find(n => n.id === item.id);
        if (note) {
            openNote(note);
        }
    } else {
        // Handle other file types if needed
        console.log('Opening file:', item.name);
    }
}

// Initialize file tree with existing notes
function initializeFileSystem() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    fileSystem.children = []; // Clear existing children
    
    // Convert existing notes to file system format
    notes.forEach(note => {
        const noteFile = {
            type: 'file',
            name: note.name.endsWith('.md') ? note.name : note.name + '.md',
            content: note.content,
            created: note.created,
            modified: note.modified,
            id: note.id,
            isNote: true
        };
        
        fileSystem.children.push(noteFile);
    });
    
    saveFileSystem();
    refreshFileTree();
}

function refreshFileTree() {
    const treeContent = document.getElementById('fileTree');
    if (treeContent) {
        treeContent.innerHTML = '';
        fileSystem.children.forEach(item => {
            treeContent.appendChild(createTreeItem(item));
        });
    }
}

function createNewFolder() {
    const folderName = document.getElementById('folderName').value.trim();
    const folderDescription = document.getElementById('folderDescription').value.trim();
    
    if (!folderName) {
        alert('Please enter a folder name');
        return;
    }

    // Store expanded folders state
    const expandedFolders = new Set();
    document.querySelectorAll('.tree-item.expanded').forEach(folder => {
        const folderName = folder.querySelector('.tree-item-text').textContent;
        expandedFolders.add(folderName);
    });
    
    const newFolder = {
        type: 'folder',
        name: folderName,
        description: folderDescription,
        children: [],
        created: new Date().toISOString(),
        modified: new Date().toISOString()
    };

    // Add to root level of file system
    if (!fileSystem.children) {
        fileSystem.children = [];
    }
    fileSystem.children.push(newFolder);
    
    // Save file system
    saveFileSystem();

    // Refresh the file tree
    refreshFileTree();

    // Restore expanded state
    expandedFolders.forEach(folderName => {
        const folder = Array.from(document.querySelectorAll('.tree-item-text')).find(el => el.textContent === folderName)?.closest('.tree-item');
        if (folder) {
            folder.classList.add('expanded');
            const folderIcon = folder.querySelector('.tree-item-icon i');
            if (folderIcon) {
                folderIcon.className = 'fas fa-folder-open';
            }
        }
    });
    
    // Close modal and reset form
    closeModal('newFolderModal');
    document.getElementById('newFolderForm').reset();
}

function renameItem(item, element) {
    let newName;
    if (arePopupsDisabled()) {
        // If popups are disabled, use inline editing
        const textElement = element.querySelector('.tree-item-text');
        textElement.contentEditable = true;
        textElement.focus();
        
        // Select the text without the extension for notes
        if (item.isNote) {
            const nameWithoutExt = item.name.replace('.md', '');
            textElement.textContent = nameWithoutExt;
            // Create a range to select the text
            const range = document.createRange();
            range.selectNodeContents(textElement);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }

        const finishRename = () => {
            textElement.contentEditable = false;
            newName = textElement.textContent;
            if (newName && newName !== item.name) {
                applyRename(item, element, newName);
            } else {
                textElement.textContent = item.name;
            }
        };

        textElement.addEventListener('blur', finishRename, { once: true });
        textElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                textElement.blur();
            } else if (e.key === 'Escape') {
                textElement.textContent = item.name;
                textElement.blur();
            }
        });
    } else {
        // Use prompt when popups are enabled
        newName = prompt('Enter new name:', item.name.replace('.md', ''));
        if (newName && newName !== item.name) {
            applyRename(item, element, newName);
        }
    }
}

function applyRename(item, element, newName) {
    // Add .md extension for notes if not present
    const finalName = item.isNote ? (newName.endsWith('.md') ? newName : newName + '.md') : newName;
    
    item.name = finalName;
    item.modified = new Date().toISOString();
    element.querySelector('.tree-item-text').textContent = finalName;
    
    // Update note name in notes storage if it's a note
    if (item.isNote) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const note = notes.find(n => n.id === item.id);
        if (note) {
            note.name = finalName;
            note.modified = item.modified;
            localStorage.setItem('notes', JSON.stringify(notes));
        }
    }
    
    saveFileSystem();
}

function deleteItem(item, element) {
    if (!arePopupsDisabled() && !confirm(`Are you sure you want to delete "${item.name}"?`)) {
        return;
    }

    // Find and remove item from parent's children
    const parent = element.parentElement.closest('.tree-item');
    if (parent) {
        const parentItem = findItemByElement(parent);
        if (parentItem) {
            parentItem.children = parentItem.children.filter(child => child !== item);
        }
    } else {
        // Item is at root level
        fileSystem.children = fileSystem.children.filter(child => child !== item);
    }

    // If it's a note, remove from notes storage
    if (item.isNote) {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const updatedNotes = notes.filter(n => n.id !== item.id);
        localStorage.setItem('notes', JSON.stringify(updatedNotes));
    }

    // Add fade-out animation
    element.style.transition = 'opacity 0.3s ease';
    element.style.opacity = '0';
    setTimeout(() => {
        element.remove();
    }, 300);
    
    saveFileSystem();
}

function findItemByElement(element) {
    // Traverse the DOM tree up to find the corresponding item in the fileSystem
    const path = [];
    let current = element;
    while (current && !current.classList.contains('file-tree-content')) {
        if (current.classList.contains('tree-item')) {
            path.unshift(current.querySelector('.tree-item-text').textContent);
        }
        current = current.parentElement;
    }

    // Traverse the fileSystem using the path
    let item = fileSystem;
    for (const name of path) {
        if (item.children) {
            item = item.children.find(child => child.name === name);
            if (!item) return null;
        }
    }
    return item;
}

function saveFileSystem() {
    localStorage.setItem('fileSystem', JSON.stringify(fileSystem));
}

function loadFileSystem() {
    const saved = localStorage.getItem('fileSystem');
    if (saved) {
        fileSystem = JSON.parse(saved);
    }

    const treeContent = document.getElementById('fileTree');
    if (treeContent) {
        treeContent.innerHTML = '';
        fileSystem.children.forEach(item => {
            treeContent.appendChild(createTreeItem(item));
        });
    }
}

// Update the DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', () => {
    initializeFileSystem();
    
    // Sort files initially by name
    sortFiles('name');

    // Remove onclick attributes and add event listeners
    const newNoteHeaderBtn = document.querySelector('.action-btn[title="New note"]');
    if (newNoteHeaderBtn) {
        newNoteHeaderBtn.removeAttribute('onclick');
        newNoteHeaderBtn.addEventListener('click', () => {
            openModal('newNoteModal');
        });
    }

    const newFolderBtn = document.querySelector('.action-btn[title="New folder"]');
    if (newFolderBtn) {
        newFolderBtn.removeAttribute('onclick');
        newFolderBtn.addEventListener('click', () => {
            openModal('newFolderModal');
        });
    }

    // Add click handler for sort button
    const sortBtn = document.querySelector('.action-btn[title="Sort files"]');
    if (sortBtn) {
        sortBtn.removeAttribute('onclick');
        sortBtn.addEventListener('click', (event) => {
            toggleSortMenu(event);
        });
    }

    // Add drop functionality to the file tree content area
    const fileTreeContent = document.getElementById('fileTree');
    if (fileTreeContent) {
        fileTreeContent.addEventListener('dragover', handleRootDragOver);
        fileTreeContent.addEventListener('dragleave', handleRootDragLeave);
        fileTreeContent.addEventListener('drop', handleRootDrop);
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