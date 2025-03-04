/**
 * files.js - Handles file and folder management
 */

import { closeModal } from './modal.js';

// Sort files by different criteria
function sortFiles(criteria) {
    console.log(`Sorting files by ${criteria}`);
    
    const fileList = document.querySelector('.file-list');
    if (!fileList) return;
    
    const fileItems = Array.from(fileList.querySelectorAll('.file-item'));
    
    fileItems.sort((a, b) => {
        if (criteria === 'name') {
            const nameA = a.querySelector('.file-name').textContent.toLowerCase();
            const nameB = b.querySelector('.file-name').textContent.toLowerCase();
            return nameA.localeCompare(nameB);
        } else if (criteria === 'modified' || criteria === 'created') {
            // In a real app, you would use actual timestamps
            // For this demo, we'll just use random sorting
            return Math.random() - 0.5;
        }
        return 0;
    });
    
    // Clear the file list
    fileList.innerHTML = '';
    
    // Add the sorted items back
    fileItems.forEach(item => {
        fileList.appendChild(item);
    });
    
    // Close the sort menu
    document.querySelector('.sort-menu').classList.remove('active');
}

// Create a new note
function createNewNote() {
    const noteTitle = document.getElementById('newNoteTitle').value.trim();
    
    if (noteTitle === '') {
        alert('Please enter a title for your note.');
        return;
    }
    
    // In a real app, you would save the note to a database
    // For this demo, we'll just add it to the file list
    const fileList = document.querySelector('.file-list');
    if (fileList) {
        const newNote = document.createElement('div');
        newNote.className = 'file-item';
        newNote.innerHTML = `
            <div class="file-icon"><i class="fas fa-file-alt"></i></div>
            <div class="file-name">${noteTitle}</div>
            <div class="file-actions">
                <button class="file-action"><i class="fas fa-ellipsis-v"></i></button>
            </div>
        `;
        fileList.appendChild(newNote);
    }
    
    // Clear the input and close the modal
    document.getElementById('newNoteTitle').value = '';
    closeModal('newNoteModal');
}

// Create a new folder
function createNewFolder() {
    const folderName = document.getElementById('newFolderName').value.trim();
    
    if (folderName === '') {
        alert('Please enter a name for your folder.');
        return;
    }
    
    // In a real app, you would save the folder to a database
    // For this demo, we'll just add it to the file list
    const fileList = document.querySelector('.file-list');
    if (fileList) {
        const newFolder = document.createElement('div');
        newFolder.className = 'file-item folder';
        newFolder.innerHTML = `
            <div class="file-icon"><i class="fas fa-folder"></i></div>
            <div class="file-name">${folderName}</div>
            <div class="file-actions">
                <button class="file-action"><i class="fas fa-ellipsis-v"></i></button>
            </div>
        `;
        fileList.appendChild(newFolder);
    }
    
    // Clear the input and close the modal
    document.getElementById('newFolderName').value = '';
    closeModal('newFolderModal');
}

// Initialize file management functionality
function initFiles() {
    // Set up sort menu toggle
    const sortButton = document.querySelector('.sort-button');
    const sortMenu = document.querySelector('.sort-menu');
    
    if (sortButton && sortMenu) {
        sortButton.addEventListener('click', function(e) {
            e.stopPropagation();
            sortMenu.classList.toggle('active');
        });
        
        // Close sort menu when clicking outside
        document.addEventListener('click', function() {
            sortMenu.classList.remove('active');
        });
    }
    
    // Set up file action menus
    document.addEventListener('click', function(e) {
        if (e.target.closest('.file-action')) {
            // Toggle file action menu
            alert('File actions would appear here in the actual app.');
        }
    });
}

export { initFiles, sortFiles, createNewNote, createNewFolder }; 