document.addEventListener('DOMContentLoaded', function() {
    // Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Chat Input Auto-resize
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');

    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Send Message Function
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message
        addMessage(message, 'user');

        // Clear input
        chatInput.value = '';
        chatInput.style.height = 'auto';

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

    // Load PDFs from localStorage
    function loadSavedPDFs() {
        const savedPDFs = JSON.parse(localStorage.getItem('savedPDFs') || '[]');
        if (savedPDFs.length > 0) {
            createPdfTabs(savedPDFs);
            displayPdf(savedPDFs[0]); // Display first PDF
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

    function createPdfTabs(pdfs) {
        const tabsContainer = document.getElementById('pdfTabs');
        tabsContainer.innerHTML = '';
        
        pdfs.forEach((pdf, index) => {
            const tab = document.createElement('div');
            tab.className = 'pdf-tab' + (index === 0 ? ' active' : '');
            tab.innerHTML = `<span class="tab-content">${pdf.name}</span>`;
            tab.onclick = () => displayPdf(pdf);
            tabsContainer.appendChild(tab);
        });
    }

    function displayPdf(pdfData) {
        const viewer = document.getElementById('pdfViewer');
        const file = base64ToFile(pdfData.data, pdfData.name);
        const fileUrl = URL.createObjectURL(file);

        // Update active tab
        document.querySelectorAll('.pdf-tab').forEach(tab => {
            tab.classList.toggle('active', 
                tab.querySelector('.tab-content').textContent === pdfData.name);
        });

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
                    const viewport = page.getViewport({ scale: 1.5 });

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
}); 