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
    let currentScale = 1.5;
    const ZOOM_STEP = 0.25;
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 3;

    zoomIn.addEventListener('click', () => {
        if (currentScale < MAX_ZOOM) {
            currentScale += ZOOM_STEP;
            updateZoom();
        }
    });

    zoomOut.addEventListener('click', () => {
        if (currentScale > MIN_ZOOM) {
            currentScale -= ZOOM_STEP;
            updateZoom();
        }
    });

    function updateZoom() {
        zoomLevel.textContent = `${Math.round(currentScale * 100)}%`;
        displayCurrentPDF();
    }

    // Load PDFs from localStorage
    let currentPDF = null;

    function loadSavedPDFs() {
        const savedPDFs = JSON.parse(localStorage.getItem('savedPDFs') || '[]');
        if (savedPDFs.length > 0) {
            currentPDF = savedPDFs[0];
            displayCurrentPDF();
        }
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
        if (!currentPDF) return;

        const viewer = document.getElementById('pdfViewer');
        const file = base64ToFile(currentPDF.data, currentPDF.name);
        const fileUrl = URL.createObjectURL(file);

        // Initialize PDF.js
        pdfjsLib.getDocument(fileUrl).promise.then(function(pdf) {
            viewer.innerHTML = ''; // Clear previous PDF
            const container = document.createElement('div');
            container.className = 'pdfViewerCanvas';
            viewer.appendChild(container);
            
            // Render all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                pdf.getPage(pageNum).then(function(page) {
                    const pageContainer = document.createElement('div');
                    pageContainer.className = 'pdf-page-container';
                    container.appendChild(pageContainer);

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    const viewport = page.getViewport({ scale: currentScale });

                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    page.render({
                        canvasContext: context,
                        viewport: viewport
                    });

                    pageContainer.appendChild(canvas);
                });
            }
        });
    }

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
}); 