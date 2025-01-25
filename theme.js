// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'system';
    
    // Set the select element to match the current theme
    const themeSelect = document.querySelector('.settings-select');
    if (themeSelect) {
        themeSelect.value = savedTheme;
        themeSelect.addEventListener('change', (e) => {
            setTheme(e.target.value);
        });
    }

    // Initial theme setup
    setTheme(savedTheme);

    // Listen for system theme changes
    if (window.matchMedia) {
        const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        colorSchemeQuery.addEventListener('change', (e) => {
            if (localStorage.getItem('theme') === 'system') {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
}

function setTheme(theme) {
    localStorage.setItem('theme', theme);
    
    if (theme === 'system') {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            applyTheme('dark');
        } else {
            applyTheme('light');
        }
    } else {
        applyTheme(theme);
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', initTheme); 