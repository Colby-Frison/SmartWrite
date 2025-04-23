/**
 * AI Model Manager
 * 
 * Handles model selection, fallback, and automatic switching when models
 * are unresponsive or have errors.
 */

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyBTleZKDD83c19YDqmkb6pyOE3TxvaSeZQ" });

class ModelManager {
    constructor() {
        // Model configurations with ordered fallback list
        this.models = {
            'GPT-4': {
                id: 'gpt-4',
                api: '/api/chat/gpt4',
                isAvailable: true,
                errorCount: 0,
                maxErrors: 3,
                fallbackOrder: ['Claude 3', 'GPT-3.5'],
                responseTimeout: 30000, // 30 seconds
                displayName: 'GPT-4'
            },
            'GPT-3.5': {
                id: 'gpt-3.5-turbo',
                api: '/api/chat/gpt35',
                isAvailable: true,
                errorCount: 0,
                maxErrors: 3,
                fallbackOrder: ['Claude 3', 'Gemini Pro'],
                responseTimeout: 15000, // 15 seconds
                displayName: 'GPT-3.5'
            },
            'Claude 3': {
                id: 'claude-3-opus',
                api: '/api/chat/claude',
                isAvailable: true,
                errorCount: 0,
                maxErrors: 3,
                fallbackOrder: ['GPT-4', 'GPT-3.5'],
                responseTimeout: 30000, // 30 seconds
                displayName: 'Claude 3'
            },
            'Gemini Pro': {
                id: 'gemini-pro',
                api: '/api/chat/gemini',
                isAvailable: true,
                errorCount: 0,
                maxErrors: 3,
                fallbackOrder: ['GPT-3.5', 'Claude 3'],
                responseTimeout: 20000, // 20 seconds
                displayName: 'Gemini Pro'
            },
            'Unstable AI': {
                id: 'unstable-ai',
                api: '/api/chat/unstable',
                isAvailable: true,
                errorCount: 0,
                maxErrors: 1, // Lower threshold for this intentionally unstable model
                fallbackOrder: ['GPT-4', 'Claude 3', 'GPT-3.5'],
                responseTimeout: 10000, // 10 seconds
                displayName: 'Unstable AI',
                isExperimental: true,
                // Explicitly mark this model as designed to fail for testing
                isDeliberatelyUnstable: true,
                errorProbability: 0.85 // 85% chance of failure
            }
        };

        // Current model selection
        this.currentModel = 'GPT-4';
        this.previousModel = null;
        this.isAutoSwitched = false;
        this.pendingRequest = null;
        this.notificationTimeout = null;
        
        // Initialize from localStorage if available
        this.loadSettings();
        
        console.log('[ModelManager] Initialized with model:', this.currentModel);
    }

    /**
     * Load saved model preferences from localStorage
     */
    loadSettings() {
        try {
            const savedModel = localStorage.getItem('selectedModel');
            if (savedModel && this.models[savedModel]) {
                this.currentModel = savedModel;
                console.log('[ModelManager] Loaded saved model preference:', savedModel);
            }
        } catch (error) {
            console.error('[ModelManager] Error loading saved model:', error);
        }
    }

    /**
     * Save current model preference to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('selectedModel', this.currentModel);
            console.log('[ModelManager] Saved model preference:', this.currentModel);
        } catch (error) {
            console.error('[ModelManager] Error saving model preference:', error);
        }
    }

    /**
     * Set the current model
     * @param {string} modelName - Name of the model to set as current
     * @param {boolean} userSelected - Whether this was manually selected by user
     * @returns {boolean} Success of operation
     */
    setModel(modelName, userSelected = true) {
        if (!this.models[modelName]) {
            console.error('[ModelManager] Model not found:', modelName);
            return false;
        }

        // If the model is not available and user is trying to select it, show notification
        if (!this.models[modelName].isAvailable && userSelected) {
            console.warn(`[ModelManager] Attempted to select disabled model: ${modelName}`);
            this.showModelUnavailableNotification(modelName);
            return false;
        }

        // Store previous model for potential rollback
        this.previousModel = this.currentModel;
        this.currentModel = modelName;
        
        // Reset auto-switch flag if user manually selected
        if (userSelected) {
            this.isAutoSwitched = false;
        }
        
        // Update UI
        this.updateModelSelectionUI();
        
        // Only save user selections to localStorage
        if (userSelected) {
            this.saveSettings();
        }
        
        console.log(`[ModelManager] Model set to ${modelName}${userSelected ? ' (user selected)' : ' (auto-switched)'}`);
        return true;
    }

    /**
     * Get the current model configuration
     * @returns {Object} Current model configuration
     */
    getCurrentModel() {
        return this.models[this.currentModel];
    }

    /**
     * Get a list of all available models
     * @param {boolean} includeExperimental - Whether to include experimental models
     * @returns {Array} List of model names
     */
    getAvailableModels(includeExperimental = true) {
        return Object.keys(this.models).filter(modelName => {
            const model = this.models[modelName];
            return model.isAvailable && (includeExperimental || !model.isExperimental);
        });
    }

    /**
     * Record an error for the current model and handle fallback if needed
     * @param {Error} error - The error that occurred
     * @returns {string|null} Name of the fallback model if switched, or null
     */
    recordError(error) {
        const model = this.models[this.currentModel];
        model.errorCount++;
        
        console.warn(`[ModelManager] Error with ${this.currentModel}, count: ${model.errorCount}/${model.maxErrors}`, error);
        
        // If error threshold exceeded, disable the model and switch to fallback
        if (model.errorCount >= model.maxErrors) {
            // Disable the model
            model.isAvailable = false;
            console.log(`[ModelManager] Disabling model ${this.currentModel} due to too many errors`);
            
            return this.switchToFallback();
        }
        
        return null;
    }

    /**
     * Reset error count for a model and re-enable it
     * @param {string} modelName - Name of the model to reset
     */
    resetErrorCount(modelName) {
        if (this.models[modelName]) {
            this.models[modelName].errorCount = 0;
            this.models[modelName].isAvailable = true;
            
            // For testing purposes: if this is the unstable model, maintain its high error probability
            if (this.models[modelName].isDeliberatelyUnstable) {
                console.log(`[ModelManager] Reset unstable model ${modelName}. It will still be unstable for testing purposes.`);
            } else {
                console.log(`[ModelManager] Reset error count for ${modelName} and re-enabled it`);
            }
        }
    }

    /**
     * Switch to the next available fallback model
     * @returns {string|null} Name of the fallback model if switched, or null
     */
    switchToFallback() {
        const currentModel = this.models[this.currentModel];
        
        // Find the next available fallback model
        const fallbackModel = currentModel.fallbackOrder.find(modelName => {
            return this.models[modelName] && this.models[modelName].isAvailable && 
                   this.models[modelName].errorCount < this.models[modelName].maxErrors;
        });
        
        if (fallbackModel) {
            console.log(`[ModelManager] Switching from ${this.currentModel} to fallback model ${fallbackModel}`);
            this.setModel(fallbackModel, false);
            this.isAutoSwitched = true;
            
            // Show notification to user
            this.showModelSwitchNotification(this.currentModel);
            
            return fallbackModel;
        } else {
            console.error(`[ModelManager] No fallback models available for ${this.currentModel}`);
            
            // Reset all error counts as a last resort and try the original model again
            Object.keys(this.models).forEach(modelName => {
                this.resetErrorCount(modelName);
            });
            
            // Show error notification
            this.showAllModelsFailedNotification();
            
            return null;
        }
    }

    /**
     * Send a chat message using the current model with fallback handling
     * @param {string} message - The message to send
     * @param {Function} onResponse - Callback for successful response
     * @param {Function} onError - Callback for error handling
     * @returns {Promise} Promise resolving to the response
     */
    async sendMessage(message, onResponse, onError) {
        const model = this.getCurrentModel();
        console.log(`[ModelManager] Sending message with ${this.currentModel}`);
        
        try {
            // Create an AbortController to handle timeouts
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, model.responseTimeout);
            
            // For demo purposes: if using Unstable AI, randomly generate errors
            if (model.id === 'unstable-ai' && Math.random() < (model.errorProbability || 0.7)) {
                // High chance of error for the unstable model based on its configuration
                clearTimeout(timeoutId);
                console.warn(`[ModelManager] 🚨 DELIBERATELY FAILING ${this.currentModel} - This is intentional for testing the fallback system`);
                throw new Error(`${this.currentModel} failed to respond (simulated failure for testing)`);
            }
            
            // In a real implementation, this would be an actual API call
            // For demo, we'll simulate a response
            const response = await this.simulateModelResponse(message, model, controller.signal);
            
            clearTimeout(timeoutId);
            
            // Success! Reset error count for this model
            this.resetErrorCount(this.currentModel);
            
            // If this was a successful response after auto-switching, let the user know
            if (this.isAutoSwitched) {
                this.showSuccessAfterSwitchNotification();
            }
            
            if (onResponse) {
                onResponse(response);
            }
            
            return response;
            
        } catch (error) {
            // Handle error and potentially switch to fallback
            console.error(`[ModelManager] Error with ${this.currentModel}:`, error);
            
            // Record error and check if we need to switch models
            const fallbackModel = this.recordError(error);
            
            if (fallbackModel) {
                // Try again with the fallback model
                return this.sendMessage(message, onResponse, onError);
            } else if (onError) {
                // No fallback available, call error handler
                onError(error);
            }
            
            throw error;
        }
    }

    /**
     * Simulate a model response (for demo purposes)
     * @param {string} message - The input message
     * @param {Object} model - The model configuration
     * @param {AbortSignal} signal - AbortController signal for timeouts
     * @returns {Promise} Promise resolving to the simulated response
     */
    simulateModelResponse(message, model, signal) {
        return new Promise((resolve, reject) => {
            const delay = Math.random() * 2000 + 1000; // 1-3 second delay
            
            this.pendingRequest = setTimeout(() => {
                this.pendingRequest = null;
                
                // Call the appropriate model-specific handler based on model ID
                // This makes it easy to replace with real API calls later
                let response;
                switch (model.id) {
                    case 'gpt-4':
                        response = this.handleGPT4Request(message);
                        break;
                    case 'gpt-3.5-turbo':
                        response = this.handleGPT35Request(message);
                        break;
                    case 'claude-3-opus':
                        response = this.handleClaudeRequest(message);
                        break;
                    case 'gemini-pro':
                        response = this.handleGeminiRequest(message);
                        break;
                    case 'unstable-ai':
                        response = this.handleUnstableAIRequest(message);
                        break;
                    default:
                        response = {
                            text: `AI response to: "${message}"`,
                            model: model.id,
                            timestamp: new Date().toISOString()
                        };
                }
                
                resolve(response);
            }, delay);
            
            // Handle abort
            if (signal) {
                signal.addEventListener('abort', () => {
                    if (this.pendingRequest) {
                        clearTimeout(this.pendingRequest);
                        this.pendingRequest = null;
                        reject(new Error(`Request to ${model.id} timed out after ${model.responseTimeout}ms`));
                    }
                });
            }
        });
    }
    
    /**
     * Handle GPT-4 request (simulation)
     * @param {string} message - User message
     * @returns {Object} Simulated response
     */
    handleGPT4Request(message) {
        // This method can be replaced with an actual API call to GPT-4
        console.log('[ModelManager] Handling GPT-4 request for:', message);
        return {
            text: `GPT-4: I've analyzed your message "${message}" and here's my response based on my advanced reasoning capabilities...`,
            model: 'gpt-4',
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Handle GPT-3.5 request (simulation)
     * @param {string} message - User message
     * @returns {Object} Simulated response
     */
    handleGPT35Request(message) {
        // This method can be replaced with an actual API call to GPT-3.5
        console.log('[ModelManager] Handling GPT-3.5 request for:', message);
        return {
            text: `GPT-3.5: Regarding "${message}", I think the following points are relevant...`,
            model: 'gpt-3.5-turbo',
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Handle Claude request (simulation)
     * @param {string} message - User message
     * @returns {Object} Simulated response
     */
    handleClaudeRequest(message) {
        // This method can be replaced with an actual API call to Claude
        console.log('[ModelManager] Handling Claude request for:', message);
        return {
            text: `Claude 3: In response to "${message}", I'd like to point out the following analysis based on my training...`,
            model: 'claude-3-opus',
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Handle Gemini request (simulation)
     * @param {string} message - User message
     * @returns {Object} Simulated response
     */
    async handleGeminiRequest(message) {
        // This method can be replaced with an actual API call to Gemini
        console.log('[ModelManager] Handling Gemini request for:', message);
        
        return await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: message,
        }).then(response => {
            console.log(response.text);
            return response;
        });
    }
    
    /**
     * Handle Unstable AI request (simulation)
     * @param {string} message - User message
     * @returns {Object} Simulated response
     */
    handleUnstableAIRequest(message) {
        // This method can be replaced with an actual API call
        console.log('[ModelManager] Handling Unstable AI request for:', message);
        return {
            text: `Unstable AI: *processing* "${message}"... result uncertain but here's my experimental analysis...`,
            model: 'unstable-ai',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Update the model selection UI to reflect the current model
     */
    updateModelSelectionUI() {
        const modelSelectBtn = document.getElementById('modelSelectBtn');
        const modelOptions = document.querySelectorAll('.model-option');
        
        if (modelSelectBtn) {
            // Update the button text to show current model
            modelSelectBtn.innerHTML = `${this.currentModel} <i class="fas fa-chevron-down"></i>`;
            
            // If this was auto-switched, add an indicator
            if (this.isAutoSwitched) {
                // Add a small indicator dot to show it was auto-switched
                modelSelectBtn.innerHTML = `${this.currentModel} <i class="fas fa-circle" style="color: #e74c3c; font-size: 6px; margin-left: 4px;"></i> <i class="fas fa-chevron-down"></i>`;
            }
        }
        
        // Update the active state in the dropdown
        if (modelOptions) {
            modelOptions.forEach(option => {
                const modelName = option.querySelector('span').textContent;
                option.classList.toggle('active', modelName === this.currentModel);
                
                // Update disabled state
                if (this.models[modelName] && !this.models[modelName].isAvailable) {
                    option.classList.add('disabled');
                    option.setAttribute('title', 'This model is currently unavailable due to errors');
                } else {
                    option.classList.remove('disabled');
                    option.removeAttribute('title');
                }
            });
        }
    }

    /**
     * Show a notification that the model was automatically switched
     * @param {string} newModel - The name of the new model that was switched to
     */
    showModelSwitchNotification(newModel) {
        // Clear any existing notification
        this.clearNotification();
        
        // Create notification container if it doesn't exist
        let notifContainer = document.getElementById('modelNotification');
        if (!notifContainer) {
            notifContainer = document.createElement('div');
            notifContainer.id = 'modelNotification';
            notifContainer.style.position = 'fixed';
            notifContainer.style.bottom = '80px';
            notifContainer.style.right = '20px';
            notifContainer.style.zIndex = '1000';
            document.body.appendChild(notifContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
        notification.style.color = 'white';
        notification.style.padding = '12px 16px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.marginTop = '10px';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '10px';
        notification.style.fontSize = '14px';
        notification.style.width = '320px';
        notification.style.animation = 'fadeIn 0.3s';
        
        // Add styles if they don't exist
        if (!document.getElementById('modelManagerStyles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'modelManagerStyles';
            styleEl.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(10px); }
                }
                .model-notification-close {
                    cursor: pointer;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                .model-notification-close:hover {
                    opacity: 1;
                }
            `;
            document.head.appendChild(styleEl);
        }
        
        // Set notification content
        notification.innerHTML = `
            <div style="flex: 1">
                <div style="margin-bottom: 4px"><strong>AI Model Switched</strong></div>
                <div>The previous model was unresponsive. Automatically switched to ${newModel}.</div>
                <div style="margin-top: 8px; display: flex; gap: 8px">
                    <button id="modelResetBtn" style="padding: 4px 8px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 4px; cursor: pointer; font-size: 12px">Restore previous</button>
                    <button id="modelSelectNewBtn" style="padding: 4px 8px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 4px; cursor: pointer; font-size: 12px">Choose model</button>
                </div>
            </div>
            <div class="model-notification-close">✕</div>
        `;
        
        // Add to container
        notifContainer.appendChild(notification);
        
        // Add event listeners
        notification.querySelector('.model-notification-close').addEventListener('click', () => {
            this.clearNotification();
        });
        
        notification.querySelector('#modelResetBtn').addEventListener('click', () => {
            if (this.previousModel) {
                this.setModel(this.previousModel, true);
                this.clearNotification();
            }
        });
        
        notification.querySelector('#modelSelectNewBtn').addEventListener('click', () => {
            // Open model selection dropdown
            const modelSelectBtn = document.getElementById('modelSelectBtn');
            const modelDropdown = document.getElementById('modelDropdown');
            if (modelSelectBtn && modelDropdown) {
                modelDropdown.classList.add('active');
                // Position it properly
                setTimeout(() => {
                    const rect = modelSelectBtn.getBoundingClientRect();
                    modelDropdown.style.position = 'fixed';
                    modelDropdown.style.bottom = `${window.innerHeight - rect.top}px`;
                    modelDropdown.style.left = `${rect.left}px`;
                }, 0);
            }
            this.clearNotification();
        });
        
        // Auto clear after 8 seconds
        this.notificationTimeout = setTimeout(() => {
            this.clearNotification();
        }, 8000);
    }

    /**
     * Show a notification when all models have failed
     */
    showAllModelsFailedNotification() {
        // Clear any existing notification
        this.clearNotification();
        
        // Create notification container if it doesn't exist
        let notifContainer = document.getElementById('modelNotification');
        if (!notifContainer) {
            notifContainer = document.createElement('div');
            notifContainer.id = 'modelNotification';
            notifContainer.style.position = 'fixed';
            notifContainer.style.bottom = '80px';
            notifContainer.style.right = '20px';
            notifContainer.style.zIndex = '1000';
            document.body.appendChild(notifContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.style.backgroundColor = 'rgba(231, 76, 60, 0.9)';
        notification.style.color = 'white';
        notification.style.padding = '12px 16px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.marginTop = '10px';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '10px';
        notification.style.fontSize = '14px';
        notification.style.width = '320px';
        notification.style.animation = 'fadeIn 0.3s';
        
        // Count how many models are disabled
        const disabledModels = Object.keys(this.models).filter(name => !this.models[name].isAvailable).length;
        const totalModels = Object.keys(this.models).length;
        
        // Set notification content
        notification.innerHTML = `
            <div style="flex: 1">
                <div style="margin-bottom: 4px"><strong>AI Service Unavailable</strong></div>
                <div>${disabledModels} of ${totalModels} models are currently disabled due to errors.</div>
                <div style="margin-top: 8px; display: flex; gap: 8px;">
                    <button id="modelResetAllBtn" style="padding: 4px 8px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 4px; cursor: pointer; font-size: 12px">Reset All Models</button>
                    <button id="modelShowDisabledBtn" style="padding: 4px 8px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 4px; cursor: pointer; font-size: 12px">Show Details</button>
                </div>
            </div>
            <div class="model-notification-close">✕</div>
        `;
        
        // Add to container
        notifContainer.appendChild(notification);
        
        // Add event listeners
        notification.querySelector('.model-notification-close').addEventListener('click', () => {
            this.clearNotification();
        });
        
        notification.querySelector('#modelResetAllBtn').addEventListener('click', () => {
            // Reset all error counts and re-enable all models
            Object.keys(this.models).forEach(modelName => {
                this.resetErrorCount(modelName);
            });
            
            // Update the UI
            this.updateModelSelectionUI();
            
            this.clearNotification();
            
            // Show confirmation
            this.showAllModelsResetNotification();
        });
        
        notification.querySelector('#modelShowDisabledBtn').addEventListener('click', () => {
            this.showDisabledModelsDetails();
        });
        
        // Auto clear after 10 seconds
        this.notificationTimeout = setTimeout(() => {
            this.clearNotification();
        }, 10000);
    }

    /**
     * Show a success notification after a successful model switch
     */
    showSuccessAfterSwitchNotification() {
        // Only show if we had auto-switched
        if (!this.isAutoSwitched) return;
        
        // Clear auto-switched flag
        this.isAutoSwitched = false;
        
        // Create notification container if it doesn't exist
        let notifContainer = document.getElementById('modelNotification');
        if (!notifContainer) {
            notifContainer = document.createElement('div');
            notifContainer.id = 'modelNotification';
            notifContainer.style.position = 'fixed';
            notifContainer.style.bottom = '80px';
            notifContainer.style.right = '20px';
            notifContainer.style.zIndex = '1000';
            document.body.appendChild(notifContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.style.backgroundColor = 'rgba(46, 204, 113, 0.9)';
        notification.style.color = 'white';
        notification.style.padding = '12px 16px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.marginTop = '10px';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '10px';
        notification.style.fontSize = '14px';
        notification.style.width = '320px';
        notification.style.animation = 'fadeIn 0.3s';
        
        // Set notification content
        notification.innerHTML = `
            <div style="flex: 1">
                <div style="margin-bottom: 4px"><strong>AI Model Working</strong></div>
                <div>${this.currentModel} successfully responded. Keep using this model?</div>
                <div style="margin-top: 8px; display: flex; gap: 8px">
                    <button id="modelKeepBtn" style="padding: 4px 8px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 4px; cursor: pointer; font-size: 12px">Keep using ${this.currentModel}</button>
                </div>
            </div>
            <div class="model-notification-close">✕</div>
        `;
        
        // Add to container
        notifContainer.appendChild(notification);
        
        // Add event listeners
        notification.querySelector('.model-notification-close').addEventListener('click', () => {
            this.clearNotification();
        });
        
        notification.querySelector('#modelKeepBtn').addEventListener('click', () => {
            // User confirmed to keep using current model, so save it
            this.saveSettings();
            this.clearNotification();
        });
        
        // Auto clear after 5 seconds
        this.notificationTimeout = setTimeout(() => {
            this.clearNotification();
        }, 5000);
    }

    /**
     * Clear any active notifications
     */
    clearNotification() {
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = null;
        }
        
        const container = document.getElementById('modelNotification');
        if (container) {
            // Fade out animations
            const notifications = container.children;
            if (notifications.length > 0) {
                for (let i = 0; i < notifications.length; i++) {
                    notifications[i].style.animation = 'fadeOut 0.3s forwards';
                }
                
                // Remove after animation completes
                setTimeout(() => {
                    container.innerHTML = '';
                }, 300);
            }
        }
    }

    /**
     * Initialize the model dropdown with all available models
     */
    initializeModelDropdown() {
        const modelDropdown = document.getElementById('modelDropdown');
        if (!modelDropdown) {
            console.error('[ModelManager] Model dropdown element not found');
            return;
        }
        
        // Clear existing options
        modelDropdown.innerHTML = '';
        
        // Get all models regardless of availability status
        const allModels = Object.keys(this.models);
        
        // Add each model to the dropdown
        allModels.forEach(modelName => {
            const model = this.models[modelName];
            const isActive = modelName === this.currentModel;
            const isDisabled = !model.isAvailable;
            
            const option = document.createElement('div');
            option.className = `model-option${isActive ? ' active' : ''}${isDisabled ? ' disabled' : ''}`;
            
            if (isDisabled) {
                option.setAttribute('title', 'This model is currently unavailable due to errors');
            }
            
            option.innerHTML = `
                <span>${modelName}</span>
                ${model.isExperimental ? '<small style="color: #e74c3c; margin-left: 4px; font-size: 10px;">BETA</small>' : ''}
                ${isDisabled ? '<i class="fas fa-ban" style="margin-left: auto; color: #e74c3c; font-size: 10px;"></i>' : '<i class="fas fa-check"></i>'}
            `;
            
            // Add click event listener (even for disabled, to show notification)
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Only set model if it's available
                if (model.isAvailable) {
                    // Update model
                    this.setModel(modelName, true);
                    
                    // Update UI
                    document.querySelectorAll('.model-option').forEach(opt => {
                        opt.classList.remove('active');
                    });
                    option.classList.add('active');
                } else {
                    // Show notification that model is disabled
                    this.showModelUnavailableNotification(modelName);
                }
                
                // Close dropdown
                modelDropdown.classList.remove('active');
            });
            
            modelDropdown.appendChild(option);
        });
        
        // Add styles for disabled options if not already present
        if (!document.getElementById('modelDropdownStyles')) {
            const style = document.createElement('style');
            style.id = 'modelDropdownStyles';
            style.textContent = `
                .model-option.disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    position: relative;
                }
                .model-option.disabled::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.1);
                }
            `;
            document.head.appendChild(style);
        }
        
        console.log('[ModelManager] Initialized model dropdown with', allModels.length, 'models');
    }
    
    /**
     * Show a notification when a user tries to select an unavailable model
     * @param {string} modelName - The name of the unavailable model
     */
    showModelUnavailableNotification(modelName) {
        // Clear any existing notification
        this.clearNotification();
        
        // Create notification container if it doesn't exist
        let notifContainer = document.getElementById('modelNotification');
        if (!notifContainer) {
            notifContainer = document.createElement('div');
            notifContainer.id = 'modelNotification';
            notifContainer.style.position = 'fixed';
            notifContainer.style.bottom = '80px';
            notifContainer.style.right = '20px';
            notifContainer.style.zIndex = '1000';
            document.body.appendChild(notifContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.style.backgroundColor = 'rgba(231, 76, 60, 0.9)';
        notification.style.color = 'white';
        notification.style.padding = '12px 16px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.marginTop = '10px';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '10px';
        notification.style.fontSize = '14px';
        notification.style.width = '320px';
        notification.style.animation = 'fadeIn 0.3s';
        
        // Set notification content
        notification.innerHTML = `
            <div style="flex: 1">
                <div style="margin-bottom: 4px"><strong>Model Unavailable</strong></div>
                <div>${modelName} is currently disabled due to errors. Please select another model.</div>
                <div style="margin-top: 8px">
                    <button id="modelFixBtn" style="padding: 4px 8px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 4px; cursor: pointer; font-size: 12px">Reset and Try Again</button>
                </div>
            </div>
            <div class="model-notification-close">✕</div>
        `;
        
        // Add to container
        notifContainer.appendChild(notification);
        
        // Add event listeners
        notification.querySelector('.model-notification-close').addEventListener('click', () => {
            this.clearNotification();
        });
        
        notification.querySelector('#modelFixBtn').addEventListener('click', () => {
            // Reset the model's error count and re-enable it
            this.resetErrorCount(modelName);
            this.clearNotification();
            
            // Update the UI to reflect the changes
            this.updateModelSelectionUI();
            
            // Show confirmation message
            this.showModelResetNotification(modelName);
        });
        
        // Auto clear after 5 seconds
        this.notificationTimeout = setTimeout(() => {
            this.clearNotification();
        }, 5000);
    }
    
    /**
     * Show a notification when a model has been reset and re-enabled
     * @param {string} modelName - The name of the reset model
     */
    showModelResetNotification(modelName) {
        // Clear any existing notification
        this.clearNotification();
        
        // Create notification container if it doesn't exist
        let notifContainer = document.getElementById('modelNotification');
        if (!notifContainer) {
            notifContainer = document.createElement('div');
            notifContainer.id = 'modelNotification';
            notifContainer.style.position = 'fixed';
            notifContainer.style.bottom = '80px';
            notifContainer.style.right = '20px';
            notifContainer.style.zIndex = '1000';
            document.body.appendChild(notifContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.style.backgroundColor = 'rgba(46, 204, 113, 0.9)';
        notification.style.color = 'white';
        notification.style.padding = '12px 16px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.marginTop = '10px';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '10px';
        notification.style.fontSize = '14px';
        notification.style.width = '320px';
        notification.style.animation = 'fadeIn 0.3s';
        
        // Set notification content
        notification.innerHTML = `
            <div style="flex: 1">
                <div style="margin-bottom: 4px"><strong>Model Reset</strong></div>
                <div>${modelName} has been reset and is available for use again.</div>
                <div style="margin-top: 8px; display: flex; gap: 8px">
                    <button id="modelUseBtn" style="padding: 4px 8px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 4px; cursor: pointer; font-size: 12px">Use ${modelName}</button>
                </div>
            </div>
            <div class="model-notification-close">✕</div>
        `;
        
        // Add to container
        notifContainer.appendChild(notification);
        
        // Add event listeners
        notification.querySelector('.model-notification-close').addEventListener('click', () => {
            this.clearNotification();
        });
        
        notification.querySelector('#modelUseBtn').addEventListener('click', () => {
            // Set this model as the current model
            this.setModel(modelName, true);
            this.clearNotification();
        });
        
        // Auto clear after 3 seconds
        this.notificationTimeout = setTimeout(() => {
            this.clearNotification();
        }, 3000);
    }

    /**
     * Show notification when all models have been reset
     */
    showAllModelsResetNotification() {
        // Clear any existing notification
        this.clearNotification();
        
        // Create notification container if it doesn't exist
        let notifContainer = document.getElementById('modelNotification');
        if (!notifContainer) {
            notifContainer = document.createElement('div');
            notifContainer.id = 'modelNotification';
            notifContainer.style.position = 'fixed';
            notifContainer.style.bottom = '80px';
            notifContainer.style.right = '20px';
            notifContainer.style.zIndex = '1000';
            document.body.appendChild(notifContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.style.backgroundColor = 'rgba(46, 204, 113, 0.9)';
        notification.style.color = 'white';
        notification.style.padding = '12px 16px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.marginTop = '10px';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '10px';
        notification.style.fontSize = '14px';
        notification.style.width = '320px';
        notification.style.animation = 'fadeIn 0.3s';
        
        // Set notification content
        notification.innerHTML = `
            <div style="flex: 1">
                <div style="margin-bottom: 4px"><strong>All Models Reset</strong></div>
                <div>All AI models have been reset and are available for use again.</div>
            </div>
            <div class="model-notification-close">✕</div>
        `;
        
        // Add to container
        notifContainer.appendChild(notification);
        
        // Add event listeners
        notification.querySelector('.model-notification-close').addEventListener('click', () => {
            this.clearNotification();
        });
        
        // Auto clear after 3 seconds
        this.notificationTimeout = setTimeout(() => {
            this.clearNotification();
        }, 3000);
    }
    
    /**
     * Show details about disabled models
     */
    showDisabledModelsDetails() {
        // Clear any existing notification
        this.clearNotification();
        
        // Get list of disabled models
        const disabledModels = Object.keys(this.models).filter(name => !this.models[name].isAvailable);
        
        if (disabledModels.length === 0) {
            // If no models are disabled, show a different message
            this.showAllModelsResetNotification();
            return;
        }
        
        // Create notification container if it doesn't exist
        let notifContainer = document.getElementById('modelNotification');
        if (!notifContainer) {
            notifContainer = document.createElement('div');
            notifContainer.id = 'modelNotification';
            notifContainer.style.position = 'fixed';
            notifContainer.style.bottom = '80px';
            notifContainer.style.right = '20px';
            notifContainer.style.zIndex = '1000';
            document.body.appendChild(notifContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.style.backgroundColor = 'rgba(52, 73, 94, 0.95)';
        notification.style.color = 'white';
        notification.style.padding = '12px 16px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.marginTop = '10px';
        notification.style.display = 'flex';
        notification.style.flexDirection = 'column';
        notification.style.gap = '10px';
        notification.style.fontSize = '14px';
        notification.style.width = '320px';
        notification.style.maxHeight = '400px';
        notification.style.overflowY = 'auto';
        notification.style.animation = 'fadeIn 0.3s';
        
        // Create header with close button
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.innerHTML = `
            <div><strong>Disabled Models (${disabledModels.length})</strong></div>
            <div class="model-notification-close" style="cursor: pointer; opacity: 0.7;">✕</div>
        `;
        
        // Create content with list of disabled models
        const content = document.createElement('div');
        content.style.marginTop = '8px';
        
        // Add each disabled model to the list
        disabledModels.forEach(modelName => {
            const modelItem = document.createElement('div');
            modelItem.style.padding = '8px 12px';
            modelItem.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            modelItem.style.borderRadius = '4px';
            modelItem.style.marginBottom = '8px';
            modelItem.style.display = 'flex';
            modelItem.style.justifyContent = 'space-between';
            modelItem.style.alignItems = 'center';
            
            modelItem.innerHTML = `
                <div>${modelName} <small style="opacity: 0.7">(disabled)</small></div>
                <button class="reset-model-btn" data-model="${modelName}" style="padding: 2px 8px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 4px; cursor: pointer; font-size: 12px">Reset</button>
            `;
            
            content.appendChild(modelItem);
        });
        
        // Add action buttons
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.justifyContent = 'space-between';
        actions.style.marginTop = '8px';
        actions.innerHTML = `
            <button id="resetAllDisabledBtn" style="flex: 1; padding: 6px 12px; background: rgba(46, 204, 113, 0.7); border: none; color: white; border-radius: 4px; cursor: pointer; font-size: 12px">Reset All</button>
        `;
        
        // Assemble the notification
        notification.appendChild(header);
        notification.appendChild(content);
        notification.appendChild(actions);
        
        // Add to container
        notifContainer.appendChild(notification);
        
        // Add event listeners
        header.querySelector('.model-notification-close').addEventListener('click', () => {
            this.clearNotification();
        });
        
        // Add event listeners for individual reset buttons
        content.querySelectorAll('.reset-model-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modelName = e.target.getAttribute('data-model');
                this.resetErrorCount(modelName);
                
                // Remove this item from the list
                const modelItem = e.target.closest('div');
                modelItem.style.animation = 'fadeOut 0.3s forwards';
                
                setTimeout(() => {
                    modelItem.remove();
                    
                    // Update the count in the header
                    const remainingItems = content.querySelectorAll('div').length;
                    header.querySelector('div:first-child').innerHTML = `<strong>Disabled Models (${remainingItems})</strong>`;
                    
                    // If no items remain, clear the notification
                    if (remainingItems === 0) {
                        this.clearNotification();
                        this.showAllModelsResetNotification();
                    }
                }, 300);
                
                // Update the UI
                this.updateModelSelectionUI();
            });
        });
        
        // Add event listener for reset all button
        actions.querySelector('#resetAllDisabledBtn').addEventListener('click', () => {
            // Reset all error counts and re-enable all models
            disabledModels.forEach(modelName => {
                this.resetErrorCount(modelName);
            });
            
            // Update the UI
            this.updateModelSelectionUI();
            
            this.clearNotification();
            this.showAllModelsResetNotification();
        });
        
        // No auto clear for this detailed view, let user dismiss it manually
    }
}

// Create global instance
window.modelManager = new ModelManager();

// Initialize once DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the model dropdown with all available models
    window.modelManager.initializeModelDropdown();
    
    console.log('[ModelManager] Model manager ready');
}); 