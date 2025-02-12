console.log('chat.js loaded');
console.log('electronAPI available:', !!window.electronAPI);
console.log('sendChatMessage available:', !!(window.electronAPI && window.electronAPI.sendChatMessage));

class Chat {
    constructor() {
        this.messagesContainer = document.getElementById('chatMessages');
        this.input = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendMessage');
        
        if (!this.messagesContainer || !this.input || !this.sendButton) {
            console.error('Chat elements not found');
            return;
        }

        this.messagesContainer.innerHTML = '';
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.sendButton.onclick = () => this.sendMessage();
        this.input.onkeypress = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        };
    }

    addMessage(content, isUser = false) {
        console.log('Adding message:', { content, isUser });  // Debug log
        const div = document.createElement('div');
        div.className = `chat-message ${isUser ? 'user' : 'assistant'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        div.appendChild(contentDiv);
        this.messagesContainer.appendChild(div);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        return div;
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        console.log('Sending message:', message);  // Debug log

        // Clear input
        this.input.value = '';

        // Add user message
        this.addMessage(message, true);

        try {
            // Show loading
            const loadingDiv = this.addMessage('Thinking...');

            // Send to Python server
            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received response:', data);  // Debug log
            
            // Remove loading message
            loadingDiv.remove();

            if (data.success) {
                this.addMessage(data.response);
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage(`Error: ${error.message}`, false);
        }
    }
}

// Initialize chat
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing chat...');
    try {
        window.chat = new Chat();
        console.log('Chat initialized successfully');
    } catch (error) {
        console.error('Failed to initialize chat:', error);
    }
}); 