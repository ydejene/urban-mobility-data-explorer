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