/**
 * AiSimplify Action Handler
 * 
 * This script handles the interaction between the AiSimplify frontend UI and the backend API.
 * It provides functionality for:
 *   1. Text summarization via API
 *   2. Clipboard operations
 *   3. Loading state management
 */

// Get references to UI elements
const simplifyBtn = document.getElementById('runSimplify');
const textBox     = document.getElementById('extractedText');
const loading     = document.getElementById('loadingOverlay');
const titleNode   = document.querySelector('.result-title');

/**
 * Display loading overlay with custom message
 * @param {string} msg - Message to display while loading
 */
const showLoading = (msg = 'Summarising with AI…') => {
  loading.classList.add('show');
  loading.querySelector('.spinner').style.display = 'block';
  loading.lastChild.textContent = msg;
};

/**
 * Hide the loading overlay
 */
const hideLoading = () => loading.classList.remove('show');

/**
 * Event handler for summarize button
 * Sends the text content to backend API for AI processing
 */
simplifyBtn?.addEventListener('click', async () => {
  const raw = textBox.value.trim();
  if (!raw) { alert('Nothing to summarise'); return; }

  try {
    showLoading();

    // Send text to the backend API for summarization
    const res = await fetch('http://localhost:3001/api/summarize', {
      method : 'POST',
      headers: { 'Content-Type':'application/json' },
      body   : JSON.stringify({ text: raw })
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const { summary } = await res.json();

    // Update UI with the received summary
    titleNode.textContent = 'Summary';
    textBox.value = summary || '(No summary returned)';
  } catch (err) {
    alert('AiSimplify failed: ' + err.message);
  } finally {
    hideLoading();
  }
  
});

/**
 * Clipboard functionality
 * Copies the current text/summary to the user's clipboard
 */
const copyBtn = document.getElementById('copyBtn');
copyBtn?.addEventListener('click', async () => {
  try {
    // Copy text to clipboard
    await navigator.clipboard.writeText(textBox.value);
    
    // Visual feedback for successful copy
    const old = copyBtn.innerHTML;
    copyBtn.innerHTML = 'Copied!';
    setTimeout(() => (copyBtn.innerHTML = old), 1500);
  } catch (err) {
    alert('Clipboard error: ' + err.message);
  }
});
