import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");

async function getGeminiAIResponse(message) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);
    return result.response.text(); 

}

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
async function sendChatMessage() {
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
        
        try {
            // Get AI response from Gemini
            const aiResponse = await getGeminiAIResponse(message);
            
            // Create AI message
            const aiMessage = document.createElement('div');
            aiMessage.className = 'chat-message ai-message';
            aiMessage.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>${aiResponse}</p>
                </div>
            `;
            chatMessages.appendChild(aiMessage);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
            console.error('Error getting response from Gemini AI:', error);
        }
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
export { getGeminiAIResponse }; // Export for testing 


