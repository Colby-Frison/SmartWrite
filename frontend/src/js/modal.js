/**
 * modal.js - Handles all modal-related functionality
 */

// Open a modal by ID
function openModal(modalId) {
    console.log(`Opening modal: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (modal) {
        console.log('Modal element found, adding active class');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        console.error(`Modal element with ID ${modalId} not found`);
    }
}

// Close a modal by ID
function closeModal(modalId) {
    console.log(`Closing modal: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        console.error(`Modal element with ID ${modalId} not found`);
    }
}

// Initialize modal event listeners
function initModals() {
    console.log('Initializing modals');
    
    // Close modal when clicking outside the modal content
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    console.log(`Found ${modalOverlays.length} modal overlays`);
    
    modalOverlays.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Handle modal triggers
    const modalTriggers = document.querySelectorAll('.dropdown-item[data-modal]');
    console.log(`Found ${modalTriggers.length} modal triggers`);
    
    modalTriggers.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = item.getAttribute('data-modal');
            openModal(modalId);
        });
    });
    
    // Log initial state of settings modal
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        console.log('Settings modal found');
        console.log('Current classes:', settingsModal.className);
        console.log('Current display style:', window.getComputedStyle(settingsModal).display);
    } else {
        console.error('Settings modal not found');
    }
}

// Export functions for use in other modules
export { openModal, closeModal, initModals }; 