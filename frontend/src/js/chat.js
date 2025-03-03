/**
 * chat.js - Handles all chat-related functionality
 */

// Auto-resize chat input
function autoResizeChatInput() {
    const chatInput = document.getElementById('chatInput');
    
    if (chatInput) {
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            const newHeight = Math.min(this.scrollHeight, 150);
            this.style.height = newHeight + 'px';
        });
    }
}

// Send a chat message
function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    
    if (chatInput && chatMessages && chatInput.value.trim() !== '') {
        // Create user message
        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user-message';
        userMessage.innerHTML = `
            <div class="message-content">
                <p>${chatInput.value.trim()}</p>
            </div>
        `;
        chatMessages.appendChild(userMessage);
        
        // Clear input
        const message = chatInput.value.trim();
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simulate AI response (in a real app, this would call an API)
        setTimeout(() => {
            // Create AI message
            const aiMessage = document.createElement('div');
            aiMessage.className = 'chat-message ai-message';
            aiMessage.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>I'm analyzing your notes about "${message}"...</p>
                    <p>This is a simulated response. In the actual application, this would be a response from the AI assistant based on your notes and question.</p>
                </div>
            `;
            chatMessages.appendChild(aiMessage);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }
}

// Initialize chat functionality
function initChat() {
    autoResizeChatInput();
    
    // Set up send button
    const sendButton = document.getElementById('sendChatBtn');
    if (sendButton) {
        sendButton.addEventListener('click', sendChatMessage);
    }
    
    // Set up enter key to send message
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
}

export { initChat, sendChatMessage }; 