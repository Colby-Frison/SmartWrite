document.addEventListener('DOMContentLoaded', function() {
    // Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const reopenSidebar = document.getElementById('reopenSidebar');
    
    toggleSidebar.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
    });

    reopenSidebar.addEventListener('click', () => {
        sidebar.classList.remove('collapsed');
    });

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

    // PDF Zoom Controls
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const zoomLevel = document.getElementById('zoomLevel');
    const zoomControl = document.querySelector('.zoom-control');
    let currentScale = 1.0;
    const ZOOM_STEP = 0.25;
    const WHEEL_ZOOM_STEP = 0.1; // Smaller step for smoother wheel zooming
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 3;
    const BASE_WIDTH = 680;

    function updateZoom() {
        zoomLevel.textContent = `${Math.round(currentScale * 100)}%`;
        const containers = document.querySelectorAll('.pdf-page-container');
        containers.forEach(container => {
            container.style.width = `${BASE_WIDTH * currentScale}px`;
        });
    }

    // Mouse wheel zoom
    zoomControl.addEventListener('wheel', (e) => {
        e.preventDefault(); // Prevent page scroll
        
        if (e.deltaY < 0) { // Scroll up = zoom in
            if (currentScale < MAX_ZOOM) {
                currentScale = Math.min(currentScale + WHEEL_ZOOM_STEP, MAX_ZOOM);
                updateZoom();
            }
        } else { // Scroll down = zoom out
            if (currentScale > MIN_ZOOM) {
                currentScale = Math.max(currentScale - WHEEL_ZOOM_STEP, MIN_ZOOM);
                updateZoom();
            }
        }
    });

    // Existing button zoom controls
    zoomIn.addEventListener('click', () => {
        if (currentScale < MAX_ZOOM) {
            currentScale = Math.min(currentScale + ZOOM_STEP, MAX_ZOOM);
            updateZoom();
        }
    });

    zoomOut.addEventListener('click', () => {
        if (currentScale > MIN_ZOOM) {
            currentScale = Math.max(currentScale - ZOOM_STEP, MIN_ZOOM);
            updateZoom();
        }
    });

    // Load PDFs from localStorage
    let pdfs = [];
    let currentPdfIndex = 0;

    function loadSavedPDFs() {
        const savedPDFs = JSON.parse(localStorage.getItem('savedPDFs') || '[]');
        if (savedPDFs.length > 0) {
            pdfs = savedPDFs;
            updatePdfFilesBar();
            displayCurrentPDF();
        }
    }

    function updatePdfFilesBar() {
        const pdfFiles = document.getElementById('pdfFiles');
        pdfFiles.innerHTML = '';
        
        pdfs.forEach((pdf, index) => {
            const tab = document.createElement('div');
            tab.className = `pdf-file-tab ${index === currentPdfIndex ? 'active' : ''}`;
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-file-pdf';
            
            const name = document.createElement('span');
            name.textContent = pdf.name;
            
            tab.appendChild(icon);
            tab.appendChild(name);
            
            tab.addEventListener('click', () => {
                if (currentPdfIndex !== index) {
                    currentPdfIndex = index;
                    updatePdfFilesBar(); // Update active state
                    displayCurrentPDF();
                }
            });
            
            pdfFiles.appendChild(tab);
        });

        // Add horizontal scroll on wheel
        pdfFiles.addEventListener('wheel', (e) => {
            e.preventDefault();
            const scrollSpeed = 50;
            pdfFiles.scrollLeft += e.deltaY * (scrollSpeed / 100);
        });
    }

    function base64ToFile(base64Data, filename) {
        const byteString = atob(base64Data.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        return new File([ab], filename, { type: 'application/pdf' });
    }

    function displayCurrentPDF() {
        if (pdfs.length === 0 || currentPdfIndex >= pdfs.length) return;

        const currentPDF = pdfs[currentPdfIndex];
        const viewer = document.getElementById('pdfViewer');
        const file = base64ToFile(currentPDF.data, currentPDF.name);
        const fileUrl = URL.createObjectURL(file);

        // Initialize PDF.js
        pdfjsLib.getDocument(fileUrl).promise.then(function(pdf) {
            viewer.innerHTML = ''; // Clear previous PDF
            const container = document.createElement('div');
            container.className = 'pdfViewerCanvas';
            viewer.appendChild(container);
            
            // Create an array of promises for rendering all pages
            const pagePromises = [];
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                pagePromises.push(
                    pdf.getPage(pageNum).then(function(page) {
                        const pageContainer = document.createElement('div');
                        pageContainer.className = 'pdf-page-container';
                        container.appendChild(pageContainer);

                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        
                        // Calculate scale to fit the base width
                        const viewport = page.getViewport({ scale: 1.0 });
                        const scale = BASE_WIDTH / viewport.width;
                        const scaledViewport = page.getViewport({ scale: scale });

                        canvas.height = scaledViewport.height;
                        canvas.width = scaledViewport.width;

                        return page.render({
                            canvasContext: context,
                            viewport: scaledViewport
                        }).promise.then(() => {
                            pageContainer.appendChild(canvas);
                        });
                    })
                );
            }
            
            // Wait for all pages to be rendered
            return Promise.all(pagePromises).then(() => {
                updateZoom(); // Apply current zoom after rendering
            });
        }).catch(error => {
            console.error('Error rendering PDF:', error);
        });
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

    // Initialize PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
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
            if (newWidth >= 75 && newWidth <= 800) {
                currentResizer.style.width = newWidth + 'px';
            }
        }
    });

    document.addEventListener('mouseup', function() {
        isResizing = false;
        currentResizer = null;
    });

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

    // Close modal when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Settings functions
    function saveSettings() {
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

    // Profile functions
    function saveProfile() {
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

    // Load saved settings and profile on page load
    document.addEventListener('DOMContentLoaded', () => {
        // Load settings
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
    });

    // Update dropdown menu click handlers
    document.addEventListener('DOMContentLoaded', () => {
        const settingsLink = document.querySelector('.dropdown-item[href="settings.html"]');
        const profileLink = document.querySelector('.dropdown-item[href="profile.html"]');
        
        if (settingsLink) {
            settingsLink.addEventListener('click', (e) => {
                e.preventDefault();
                openModal('settingsModal');
            });
        }
        
        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                e.preventDefault();
                openModal('profileModal');
            });
        }
    });
}); 