/**
 * sidebar.js - Handles all sidebar-related functionality
 */

// Toggle sidebar visibility
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar.classList.contains('collapsed')) {
        sidebar.classList.remove('collapsed');
        toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        mainContent.classList.remove('expanded');
    } else {
        sidebar.classList.add('collapsed');
        toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        mainContent.classList.add('expanded');
    }
}

// Initialize sidebar functionality
function initSidebar() {
    // Set up sidebar toggle button
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Set up sidebar resizing
    const sidebar = document.getElementById('sidebar');
    const chatSection = document.getElementById('chatSection');
    
    let isResizing = false;
    let currentResizer = null;
    
    // Add event listeners for sidebar resizing
    if (sidebar) {
        sidebar.addEventListener('mousedown', function(e) {
            // Check if the click is on the right edge (within 10px)
            const rect = sidebar.getBoundingClientRect();
            if (e.clientX >= rect.right - 10 && e.clientX <= rect.right) {
                isResizing = true;
                currentResizer = sidebar;
                document.body.style.cursor = 'ew-resize';
                e.preventDefault();
            }
        });
    }
    
    // Add event listeners for chat section resizing
    if (chatSection) {
        chatSection.addEventListener('mousedown', function(e) {
            // Check if the click is on the left edge (within 10px)
            const rect = chatSection.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.left + 10) {
                isResizing = true;
                currentResizer = chatSection;
                document.body.style.cursor = 'ew-resize';
                e.preventDefault();
            }
        });
    }
    
    // Handle mouse movement for resizing
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
            
            // Apply constraints - minimum 200px
            if (newWidth >= 200 && newWidth <= 800) {
                currentResizer.style.width = newWidth + 'px';
                
                // Save the width preference
                localStorage.setItem('chatSectionWidth', newWidth);
                
                // Center the PDF viewer after resize
                const pdfViewer = document.querySelector('.pdf-viewer');
                if (pdfViewer) {
                    pdfViewer.scrollLeft = (pdfViewer.scrollWidth - pdfViewer.clientWidth) / 2;
                }
            }
        }
    });

    // Handle mouse up to stop resizing
    document.addEventListener('mouseup', function() {
        if (isResizing) {
            isResizing = false;
            currentResizer = null;
            document.body.style.cursor = '';
        }
    });
}

export { toggleSidebar, initSidebar }; 