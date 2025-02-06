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
    const noteDescription = document.getElementById('noteDescription').value.trim();
    const filesList = document.getElementById('selectedNoteFiles');
    
    if (!noteName) {
        alert('Please enter a note name');
        return;
    }
    
    // Get existing notes or initialize empty array
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    
    // Create new note object
    const newNote = {
        id: Date.now(),
        name: noteName,
        description: noteDescription,
        date: new Date().toISOString(),
        files: Array.from(filesList.children).map(item => {
            const fileName = item.querySelector('span').textContent;
            const fileType = item.classList.contains('pdf') ? 'pdf' :
                           item.classList.contains('image') ? 'image' : 'document';
            return {
                name: fileName,
                type: fileType
            };
        })
    };
    
    // Add new note to array
    notes.unshift(newNote);
    
    // Save to localStorage
    localStorage.setItem('notes', JSON.stringify(notes));
    
    // Add note to the UI
    addNoteToList(newNote);
    
    // Close modal and reset form
    closeModal('newNoteModal');
    document.getElementById('newNoteForm').reset();
    filesList.innerHTML = '';

    // Open the newly created note
    openNote(newNote);
}

function addNoteToList(note) {
    const notesList = document.querySelector('.notes-list');
    if (!notesList) return;
    
    const noteElement = document.createElement('div');
    noteElement.className = 'note-item';
    noteElement.dataset.noteId = note.id;
    
    noteElement.innerHTML = `
        <div class="note-content">
            <div class="note-title">${note.name}</div>
            <div class="note-preview">${note.description || 'No description'}</div>
            <div class="note-date">
                ${new Date(note.date).toLocaleDateString()}
            </div>
        </div>
        <div class="note-settings">
            <button class="note-settings-btn">
                <i class="fas fa-ellipsis-v"></i>
            </button>
            <div class="note-settings-menu">
                <button class="note-settings-item rename-note">
                    <i class="fas fa-edit"></i>
                    Rename
                </button>
                <button class="note-settings-item delete-note">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>
    `;
    
    // Add click handler for the note content
    const noteContent = noteElement.querySelector('.note-content');
    noteContent.addEventListener('click', () => {
        openNote(note);
    });

    // Add click handler for settings button
    const settingsBtn = noteElement.querySelector('.note-settings-btn');
    const settingsMenu = noteElement.querySelector('.note-settings-menu');
    
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close all other open menus
        document.querySelectorAll('.note-settings-menu.active').forEach(menu => {
            if (menu !== settingsMenu) {
                menu.classList.remove('active');
            }
        });
        settingsMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', () => {
        settingsMenu.classList.remove('active');
    });

    // Rename note handler
    const renameBtn = noteElement.querySelector('.rename-note');
    renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newName = prompt('Enter new name for the note:', note.name);
        if (newName && newName.trim()) {
            // Update note in localStorage
            const notes = JSON.parse(localStorage.getItem('notes') || '[]');
            const noteIndex = notes.findIndex(n => n.id === note.id);
            if (noteIndex !== -1) {
                notes[noteIndex].name = newName.trim();
                localStorage.setItem('notes', JSON.stringify(notes));
                
                // Update UI
                noteElement.querySelector('.note-title').textContent = newName.trim();
                note.name = newName.trim(); // Update the note object
            }
        }
        settingsMenu.classList.remove('active');
    });

    // Delete note handler
    const deleteBtn = noteElement.querySelector('.delete-note');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            // Remove note from localStorage
            const notes = JSON.parse(localStorage.getItem('notes') || '[]');
            const noteToDelete = notes.find(n => n.id === note.id);
            const updatedNotes = notes.filter(n => n.id !== note.id);
            localStorage.setItem('notes', JSON.stringify(updatedNotes));
            
            // Remove associated PDFs if they're not used by other notes
            if (noteToDelete && noteToDelete.files) {
                const savedPDFs = JSON.parse(localStorage.getItem('savedPDFs') || '[]');
                const remainingNotes = JSON.parse(localStorage.getItem('notes') || '[]');
                
                const updatedPDFs = savedPDFs.filter(pdf => {
                    // Keep PDF if it's used by any remaining note
                    return remainingNotes.some(n => 
                        n.files.some(f => f.name === pdf.name)
                    );
                });
                
                localStorage.setItem('savedPDFs', JSON.stringify(updatedPDFs));
            }
            
            // Clear PDF viewer if this note was open
            if (noteElement.classList.contains('active')) {
                const pdfViewer = document.getElementById('pdfViewer');
                if (pdfViewer) {
                    pdfViewer.innerHTML = '';
                }
                const pdfFiles = document.getElementById('pdfFiles');
                if (pdfFiles) {
                    pdfFiles.innerHTML = '';
                }
                pdfs = [];
                currentPdfIndex = -1;
            }
            
            // Add deleting class for animation
            noteElement.classList.add('deleting');
            
            // Remove element after animation
            setTimeout(() => {
                noteElement.remove();
            }, 300);
            
            // Close the settings menu
            settingsMenu.classList.remove('active');
        }
    });
    
    // Add to the beginning of the list
    if (notesList.firstChild) {
        notesList.insertBefore(noteElement, notesList.firstChild);
    } else {
        notesList.appendChild(noteElement);
    }
}

// Function to open a note
function openNote(note) {
    // Highlight the selected note in the sidebar
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.noteId === note.id.toString()) {
            item.classList.add('active');
        }
    });

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
}

// Update loadExistingNotes to include note IDs
function loadExistingNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const notesList = document.querySelector('.notes-list');
    if (!notesList) return;
    
    // Clear existing notes
    notesList.innerHTML = '';
    
    // Add each note to the list
    notes.forEach(note => addNoteToList(note));
}

// Add this to your DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    loadExistingNotes();
}); 