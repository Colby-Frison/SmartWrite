/**
 * filetree.js - Handles file tree functionality
 */

// Sample file structure
const fileSystem = {
    id: 'root',
    name: 'My Files',
    type: 'folder',
    children: [
        {
            id: 'folder1',
            name: 'Study Notes',
            type: 'folder',
            children: [
                {
                    id: 'file1',
                    name: 'final review.pdf',
                    type: 'file',
                    fileType: 'pdf',
                    path: '/frontend/public/assets/Files/final review.pdf'
                },
                {
                    id: 'file2',
                    name: 'HW 3-Ch1.pdf',
                    type: 'file',
                    fileType: 'pdf',
                    path: '/frontend/public/assets/Files/HW 3-Ch1.pdf'
                }
            ]
        },
        {
            id: 'folder2',
            name: 'Project Research',
            type: 'folder',
            children: [
                {
                    id: 'file3',
                    name: 'Appendix.pdf',
                    type: 'file',
                    fileType: 'pdf',
                    path: '/frontend/public/assets/Files/Appendix.pdf'
                },
                {
                    id: 'folder3',
                    name: 'References',
                    type: 'folder',
                    children: [
                        {
                            id: 'file4',
                            name: 'final review.pdf',
                            type: 'file',
                            fileType: 'pdf',
                            path: '/frontend/public/assets/Files/final review.pdf'
                        },
                        {
                            id: 'file5',
                            name: 'HW 3-Ch1.pdf',
                            type: 'file',
                            fileType: 'pdf',
                            path: '/frontend/public/assets/Files/HW 3-Ch1.pdf'
                        }
                    ]
                }
            ]
        },
        {
            id: 'file6',
            name: 'Appendix.pdf',
            type: 'file',
            fileType: 'pdf',
            path: '/frontend/public/assets/Files/Appendix.pdf'
        }
    ]
};

// Track expanded folders
const expandedFolders = new Set(['root']);

// Track selected item
let selectedItemId = null;

// Function to render the file tree
function renderFileTree() {
    const fileTreeElement = document.getElementById('fileTree');
    if (!fileTreeElement) return;
    
    // Clear existing content
    fileTreeElement.innerHTML = '';
    
    // Render the root folder's children
    renderFolder(fileTreeElement, fileSystem);
    
    console.log('File tree rendered');
}

// Function to render a folder and its children
function renderFolder(parentElement, folder) {
    const isExpanded = expandedFolders.has(folder.id);
    
    if (folder.id !== 'root') {
        // Create folder item
        const folderElement = document.createElement('div');
        folderElement.className = 'tree-item' + (isExpanded ? ' expanded' : '');
        folderElement.dataset.id = folder.id;
        
        // Create folder content
        const folderContent = document.createElement('div');
        folderContent.className = 'tree-item-content' + (selectedItemId === folder.id ? ' selected' : '');
        folderContent.innerHTML = `
            <span class="tree-item-toggle"><i class="fas fa-chevron-right"></i></span>
            <span class="tree-item-icon"><i class="fas fa-folder${isExpanded ? '-open' : ''}"></i></span>
            <span class="tree-item-text">${folder.name}</span>
        `;
        
        // Add click event to toggle folder
        folderContent.addEventListener('click', function(e) {
            // If clicking on the toggle icon or anywhere on the folder content
            toggleFolder(folder.id);
            e.stopPropagation();
            // No longer selecting the folder when clicked
        });
        
        folderElement.appendChild(folderContent);
        
        // Create container for children
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'tree-item-children';
        folderElement.appendChild(childrenContainer);
        
        parentElement.appendChild(folderElement);
        
        // If expanded, render children
        if (isExpanded && folder.children && folder.children.length > 0) {
            folder.children.forEach(child => {
                if (child.type === 'folder') {
                    renderFolder(childrenContainer, child);
                } else {
                    renderFile(childrenContainer, child);
                }
            });
        }
    } else {
        // For root folder, just render its children directly
        if (folder.children && folder.children.length > 0) {
            folder.children.forEach(child => {
                if (child.type === 'folder') {
                    renderFolder(parentElement, child);
                } else {
                    renderFile(parentElement, child);
                }
            });
        }
    }
}

// Function to render a file
function renderFile(parentElement, file) {
    const fileElement = document.createElement('div');
    fileElement.className = 'tree-item';
    fileElement.dataset.id = file.id;
    
    // Create file content
    const fileContent = document.createElement('div');
    fileContent.className = 'tree-item-content' + (selectedItemId === file.id ? ' selected' : '');
    
    // Choose icon based on file type
    let fileIcon = 'fa-file';
    if (file.fileType === 'pdf') {
        fileIcon = 'fa-file-pdf';
    } else if (file.fileType === 'image') {
        fileIcon = 'fa-file-image';
    } else if (file.fileType === 'doc' || file.fileType === 'docx') {
        fileIcon = 'fa-file-word';
    }
    
    fileContent.innerHTML = `
        <span class="tree-item-toggle" style="visibility: hidden;"><i class="fas fa-chevron-right"></i></span>
        <span class="tree-item-icon"><i class="fas ${fileIcon}"></i></span>
        <span class="tree-item-text">${file.name}</span>
    `;
    
    // Add click event to select file
    fileContent.addEventListener('click', function() {
        selectItem(file.id);
        // Simulate opening the file
        console.log(`Opening file: ${file.name}`);
    });
    
    fileElement.appendChild(fileContent);
    parentElement.appendChild(fileElement);
}

// Function to toggle folder expansion
function toggleFolder(folderId) {
    if (expandedFolders.has(folderId)) {
        expandedFolders.delete(folderId);
    } else {
        expandedFolders.add(folderId);
    }
    
    renderFileTree();
}

// Function to select an item
function selectItem(itemId) {
    console.log(`[FileTree] selectItem called with itemId: ${itemId}`);
    
    // Find the item in the file system
    const findItem = (folder) => {
        if (folder.id === itemId) {
            return folder;
        }
        
        if (folder.children) {
            for (const child of folder.children) {
                const found = findItem(child);
                if (found) return found;
            }
        }
        
        return null;
    };
    
    const item = findItem(fileSystem);
    
    if (!item) {
        console.error(`[FileTree] Item with id ${itemId} not found in file system`);
        return;
    }
    
    console.log(`[FileTree] Found item:`, item);
    
    // Only select the item if it's a file
    if (item && item.type === 'file') {
        selectedItemId = itemId;
        
        // Remove selected class from all items
        document.querySelectorAll('.tree-item-content').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selected class to selected item
        const selectedItem = document.querySelector(`.tree-item[data-id="${itemId}"] > .tree-item-content`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
            console.log(`[FileTree] Added 'selected' class to item with id ${itemId}`);
        } else {
            console.error(`[FileTree] Could not find DOM element for item with id ${itemId}`);
        }
        
        console.log(`[FileTree] Selected item: ${itemId}`);
        
        // Load the PDF file if it's a PDF
        if (item.fileType === 'pdf') {
            console.log(`[FileTree] Attempting to load PDF: ${item.path}`);
            
            // Verify the path exists
            fetch(item.path)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    console.log(`[FileTree] PDF file exists at path: ${item.path}`);
                    
                    // Call the loadPDF function from the global scope
                    if (typeof window.loadPDF === 'function') {
                        console.log(`[FileTree] Calling window.loadPDF with path: ${item.path}`);
                        window.loadPDF(item.path);
                    } else {
                        console.error('[FileTree] loadPDF function not available in global scope');
                    }
                })
                .catch(error => {
                    console.error(`[FileTree] Error checking PDF file: ${error.message}`);
                });
        }
    } else {
        console.log(`[FileTree] Item is not a file or has no fileType property:`, item);
    }
}

// Function to create a new folder
function createNewFolder(folderName) {
    if (!folderName) return;
    
    // Create new folder object
    const newFolder = {
        id: 'folder' + Date.now(),
        name: folderName,
        type: 'folder',
        children: []
    };
    
    // Add to file system (at root level for simplicity)
    fileSystem.children.push(newFolder);
    
    // Re-render file tree
    renderFileTree();
    
    console.log(`Created new folder: ${folderName}`);
    
    return newFolder;
}

// Function to create a new note
function createNewNote(noteName) {
    if (!noteName) return;
    
    // Create new file object
    const newFile = {
        id: 'file' + Date.now(),
        name: noteName,
        type: 'file',
        fileType: 'pdf',
        path: '/frontend/public/assets/Files/final review.pdf' // Default to the first PDF
    };
    
    // Add to file system (at root level for simplicity)
    fileSystem.children.push(newFile);
    
    // Re-render file tree
    renderFileTree();
    
    console.log(`Created new note: ${noteName}`);
    
    return newFile;
}

// Function to sort the file system
function sortFileSystem(sortType) {
    console.log(`Sorting by: ${sortType}`);
    
    // Sort function
    const sortFunction = (a, b) => {
        // Folders always come before files
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        
        // Sort by name
        if (sortType === 'name') {
            return a.name.localeCompare(b.name);
        }
        
        // For demo purposes, other sort types just use name
        return a.name.localeCompare(b.name);
    };
    
    // Sort root children
    fileSystem.children.sort(sortFunction);
    
    // Sort children of all folders
    const sortFolderChildren = (folder) => {
        if (folder.children && folder.children.length > 0) {
            folder.children.sort(sortFunction);
            folder.children.forEach(child => {
                if (child.type === 'folder') {
                    sortFolderChildren(child);
                }
            });
        }
    };
    
    sortFolderChildren(fileSystem);
    
    // Re-render file tree
    renderFileTree();
}

// Initialize file tree
function initFileTree() {
    renderFileTree();
    
    // Add click handlers for file tree action buttons
    const newNoteBtn = document.querySelector('.file-tree-actions .action-btn:nth-child(1)');
    if (newNoteBtn) {
        newNoteBtn.addEventListener('click', function() {
            // This will be handled by the main script
            console.log('New note button clicked');
        });
    }
    
    const newFolderBtn = document.querySelector('.file-tree-actions .action-btn:nth-child(2)');
    if (newFolderBtn) {
        newFolderBtn.addEventListener('click', function() {
            // This will be handled by the main script
            console.log('New folder button clicked');
        });
    }
    
    const sortBtn = document.querySelector('.file-tree-actions .action-btn:nth-child(3)');
    if (sortBtn) {
        sortBtn.addEventListener('click', function() {
            const sortMenu = document.getElementById('sortMenu');
            if (sortMenu) {
                sortMenu.classList.toggle('active');
            }
        });
    }
}

export { 
    initFileTree, 
    renderFileTree, 
    createNewFolder, 
    createNewNote, 
    sortFileSystem,
    fileSystem
}; 