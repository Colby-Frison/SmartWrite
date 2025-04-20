/**
 * Chat Model Integration
 * This file integrates the AI Model Manager with the chat system
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Chat Integration] Initializing chat model integration');
    
    // Replace the original sendChatMessage function with our enhanced version
    window.originalSendChatMessage = window.sendChatMessage;
    
    // New enhanced version with model manager support
    window.sendChatMessage = function() {
        const chatInput = document.getElementById('chatInput');
        const chatMessages = document.getElementById('chatMessages');
        const chatInputContainer = document.querySelector('.chat-input-container');
        
        // Check if input is not empty
        if (chatInput && chatInput.value.trim() !== '') {
            const messageText = chatInput.value.trim();
            
            // Create message object for user message
            const userMessage = {
                type: 'user',
                text: messageText,
                timestamp: new Date().toISOString()
            };
            
            // Add user message to chat history if it exists
            if (window.chatHistory) {
                window.chatHistory.push(userMessage);
            }
            
            // Create and append user message element
            const userMessageElement = document.createElement('div');
            userMessageElement.className = 'message user';
            userMessageElement.innerHTML = `
                <div class="message-content">
                    ${messageText}
                </div>
            `;
            chatMessages.appendChild(userMessageElement);
            
            // Clear input and reset heights
            chatInput.value = '';
            chatInput.style.height = 'auto';
            if (chatInputContainer) {
                chatInputContainer.style.height = '100px';
            }
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Add a loading indicator
            const loadingElement = document.createElement('div');
            loadingElement.className = 'message assistant';
            loadingElement.id = 'loadingMessage';
            loadingElement.innerHTML = `
                <div class="message-content" style="display: flex; gap: 8px; align-items: center;">
                    <div class="loading-dots">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                    </div>
                    <div style="font-size: 12px; opacity: 0.8;">Processing with ${window.modelManager ? window.modelManager.currentModel : 'AI'}</div>
                </div>
            `;
            chatMessages.appendChild(loadingElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Add loading dots animation if it doesn't exist
            if (!document.getElementById('loadingDotsStyle')) {
                const style = document.createElement('style');
                style.id = 'loadingDotsStyle';
                style.textContent = `
                    .loading-dots {
                        display: flex;
                        gap: 4px;
                    }
                    .loading-dots .dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background-color: var(--text-secondary);
                        animation: dot-pulse 1.5s infinite ease-in-out;
                    }
                    .loading-dots .dot:nth-child(2) {
                        animation-delay: 0.2s;
                    }
                    .loading-dots .dot:nth-child(3) {
                        animation-delay: 0.4s;
                    }
                    @keyframes dot-pulse {
                        0%, 100% { transform: scale(0.8); opacity: 0.6; }
                        50% { transform: scale(1.2); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Use ModelManager to send message with fallback capabilities
            if (window.modelManager) {
                window.modelManager.sendMessage(
                    messageText,
                    // Success handler
                    (response) => {
                        // Remove loading indicator
                        const loadingMsg = document.getElementById('loadingMessage');
                        if (loadingMsg) {
                            loadingMsg.remove();
                        }
                        
                        // Create response text from the model response
                        const responseText = response.text;
                        
                        // Create message object
                        const assistantMessage = {
                            type: 'assistant',
                            text: responseText,
                            model: response.model,
                            timestamp: new Date().toISOString()
                        };
                        
                        // Add to chat history if it exists
                        if (window.chatHistory) {
                            window.chatHistory.push(assistantMessage);
                        }
                        
                        // Create and append assistant message element
                        const assistantMessageElement = document.createElement('div');
                        assistantMessageElement.className = 'message assistant';
                        assistantMessageElement.innerHTML = `
                            <div class="message-content">
                                ${responseText}
                            </div>
                        `;
                        chatMessages.appendChild(assistantMessageElement);
                        
                        // Scroll to bottom
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    },
                    // Error handler
                    (error) => {
                        // Remove loading indicator
                        const loadingMsg = document.getElementById('loadingMessage');
                        if (loadingMsg) {
                            loadingMsg.remove();
                        }
                        
                        // Create error message
                        const errorMessageElement = document.createElement('div');
                        errorMessageElement.className = 'message assistant';
                        errorMessageElement.innerHTML = `
                            <div class="message-content" style="border-left: 3px solid #e74c3c; padding-left: 8px;">
                                <div style="color: #e74c3c; margin-bottom: 4px;"><strong>Error</strong></div>
                                <div>Sorry, I encountered a problem while processing your request. Please try again later.</div>
                                <div style="font-size: 12px; margin-top: 4px; opacity: 0.7;">${error.message}</div>
                            </div>
                        `;
                        chatMessages.appendChild(errorMessageElement);
                        
                        // Scroll to bottom
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                        
                        console.error('Error in chat response:', error);
                    }
                );
            } else {
                // Fallback if ModelManager is not available - use original function
                // Remove the loading indicator first
                const loadingMsg = document.getElementById('loadingMessage');
                if (loadingMsg) {
                    loadingMsg.remove();
                }
                
                // Simulate a response instead of using the original function
                // This is to avoid duplicate user messages
                setTimeout(() => {
                    // Create response text
                    const responseText = `I received your message: "${messageText}". This is a simulated response.`;
                    
                    // Create message object
                    const assistantMessage = {
                        type: 'assistant',
                        text: responseText,
                        timestamp: new Date().toISOString()
                    };
                    
                    // Add to chat history if it exists
                    if (window.chatHistory) {
                        window.chatHistory.push(assistantMessage);
                    }
                    
                    // Create and append assistant message element
                    const assistantMessageElement = document.createElement('div');
                    assistantMessageElement.className = 'message assistant';
                    assistantMessageElement.innerHTML = `
                        <div class="message-content">
                            ${responseText}
                        </div>
                    `;
                    chatMessages.appendChild(assistantMessageElement);
                    
                    // Scroll to bottom
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }, 1000);
            }
            
            return userMessage;
        }
        
        return null;
    };
    
    // Update model dropdown to include the Unstable AI option
    function enhanceModelDropdown() {
        const modelDropdown = document.getElementById('modelDropdown');
        if (!modelDropdown) return;
        
        // Add the Unstable AI option if it doesn't exist
        if (!modelDropdown.querySelector('.model-option span[data-model="unstable-ai"]')) {
            const unstableOption = document.createElement('div');
            unstableOption.className = 'model-option';
            unstableOption.innerHTML = `
                <span data-model="unstable-ai">Unstable AI</span>
                <small style="color: #e74c3c; margin-left: 4px; font-size: 10px;">BETA</small>
                <i class="fas fa-check"></i>
            `;
            
            // Add a tooltip warning about this model
            unstableOption.setAttribute('title', 'Warning: This model is deliberately unstable and will frequently fail to demonstrate the fallback system');
            
            // Add custom styling to make it stand out
            unstableOption.style.borderLeft = '3px solid #e74c3c';
            
            // Add it to the dropdown
            modelDropdown.appendChild(unstableOption);
            
            // Add click handler
            unstableOption.addEventListener('click', function(e) {
                // Show a confirmation dialog before selecting this model
                const shouldSelect = confirm('⚠️ Warning: The Unstable AI model is deliberately designed to fail for testing purposes. It will likely fail and trigger the automatic fallback system. Do you want to proceed?');
                
                if (!shouldSelect) {
                    // Prevent default click behavior if user cancels
                    e.stopPropagation();
                }
            });
            
            console.log('[Chat Integration] Added Unstable AI option to dropdown');
        }
    }
    
    // Wait a bit for other scripts to load and then enhance the dropdown
    setTimeout(enhanceModelDropdown, 1000);
    
    console.log('[Chat Integration] Chat model integration initialized');
}); 