document.addEventListener('DOMContentLoaded', function() {
    const editBtn = document.getElementById('editProfileBtn');
    const saveBtn = document.getElementById('saveProfileBtn');
    const cancelBtn = document.getElementById('cancelProfileBtn');
    const avatarUpload = document.getElementById('avatarUpload');
    const avatarImage = document.getElementById('avatarImage');
    const defaultAvatar = document.getElementById('defaultAvatar');
    const avatarOverlay = document.querySelector('.avatar-overlay');
    
    // Store original values for cancellation
    let originalUsername = document.getElementById('usernameDisplay').textContent;
    let originalEmail = document.getElementById('emailDisplay').textContent;
    let originalAvatar = null;

    // Handle profile picture upload
    avatarUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    avatarImage.src = e.target.result;
                    avatarImage.classList.remove('hidden');
                    defaultAvatar.classList.add('hidden');
                    localStorage.setItem('profilePicture', e.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please upload an image file.');
            }
        }
    });

    // Load saved profile picture
    const savedProfilePicture = localStorage.getItem('profilePicture');
    if (savedProfilePicture) {
        avatarImage.src = savedProfilePicture;
        avatarImage.classList.remove('hidden');
        defaultAvatar.classList.add('hidden');
    }

    // Enable editing
    editBtn.addEventListener('click', function() {
        toggleEditMode(true);
    });

    // Save changes
    saveBtn.addEventListener('click', function() {
        const usernameInput = document.getElementById('usernameInput');
        const emailInput = document.getElementById('emailInput');
        
        // Validate username
        if (!usernameInput.checkValidity()) {
            usernameInput.classList.add('error');
            alert('Username must be 3-20 characters long and contain only letters, numbers, and underscores.');
            return;
        }
        
        // Validate email
        if (!emailInput.checkValidity()) {
            emailInput.classList.add('error');
            alert('Please enter a valid email address.');
            return;
        }

        // Save new values
        originalUsername = usernameInput.value;
        originalEmail = emailInput.value;
        document.getElementById('usernameDisplay').textContent = originalUsername;
        document.getElementById('emailDisplay').textContent = originalEmail;

        // Save to localStorage
        localStorage.setItem('username', originalUsername);
        localStorage.setItem('email', originalEmail);

        toggleEditMode(false);
    });

    // Cancel editing
    cancelBtn.addEventListener('click', function() {
        document.getElementById('usernameInput').value = originalUsername;
        document.getElementById('emailInput').value = originalEmail;
        toggleEditMode(false);
    });

    // Load saved values
    const savedUsername = localStorage.getItem('username');
    const savedEmail = localStorage.getItem('email');
    if (savedUsername) {
        originalUsername = savedUsername;
        document.getElementById('usernameDisplay').textContent = savedUsername;
        document.getElementById('usernameInput').value = savedUsername;
    }
    if (savedEmail) {
        originalEmail = savedEmail;
        document.getElementById('emailDisplay').textContent = savedEmail;
        document.getElementById('emailInput').value = savedEmail;
    }

    // Helper function to toggle edit mode
    function toggleEditMode(editing) {
        const displays = document.querySelectorAll('.value');
        const inputs = document.querySelectorAll('.edit-input');
        
        displays.forEach(el => el.classList.toggle('hidden', editing));
        inputs.forEach(el => {
            el.classList.toggle('hidden', !editing);
            if (editing) {
                el.classList.remove('error');
            }
        });
        
        editBtn.classList.toggle('hidden', editing);
        saveBtn.classList.toggle('hidden', !editing);
        cancelBtn.classList.toggle('hidden', !editing);
        avatarOverlay.classList.toggle('hidden', !editing);
    }
}); 