// Authentication check and display
document.addEventListener('DOMContentLoaded', () => {
    // Display user email
    const userEmail = localStorage.getItem('user_email');
    if (userEmail) {
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = userEmail;
        }
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_email');
            window.location.href = 'login.html';
        });
    }
});

// Apply filters button functionality
const applyFiltersBtn = document.getElementById('apply-filters');

if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
        console.log('Applying filters...');
        
        // Get current filter values
        const borough = document.getElementById('borough-select').value;
        const hour = document.getElementById('hour-select').value;
        
        // Trigger change events to update map and charts
        const boroughEvent = new Event('change');
        const hourEvent = new Event('change');
        
        document.getElementById('borough-select').dispatchEvent(boroughEvent);
        document.getElementById('hour-select').dispatchEvent(hourEvent);
        
        // Visual feedback
        applyFiltersBtn.textContent = 'Applied!';
        applyFiltersBtn.style.background = '#45a049';
        
        setTimeout(() => {
            applyFiltersBtn.textContent = 'Apply Filters';
            applyFiltersBtn.style.background = '#4CAF50';
        }, 1500);
    });
}