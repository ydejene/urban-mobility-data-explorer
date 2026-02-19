// Initialize Leaflet map
document.addEventListener('DOMContentLoaded', () => {
    // Create map centered on NYC
    const map = L.map('map').setView([40.7128, -74.0060], 11);
    
    // Add dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);
    
    console.log('Map initialized successfully');
});