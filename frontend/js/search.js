// Zone search functionality
document.addEventListener('DOMContentLoaded', () => {
    const zoneSearch = document.getElementById('zoneSearch');
    const searchResults = document.getElementById('searchResults');
    
    // Use sample zones or wait for API
    let allZones = typeof SAMPLE_ZONES !== 'undefined' ? SAMPLE_ZONES : [];
    
    if (zoneSearch && searchResults) {
        zoneSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (query.length === 0) {
                searchResults.classList.remove('active');
                return;
            }
            
            const matches = allZones.filter(zone =>
                zone.zone.toLowerCase().includes(query) ||
                zone.borough.toLowerCase().includes(query)
            ).slice(0, 10);
            
            if (matches.length > 0) {
                searchResults.innerHTML = matches.map(zone => `
                    <div class="search-result-item" data-zone-id="${zone.id}">
                        <strong>${zone.zone}</strong>
                        <small>${zone.borough}</small>
                    </div>
                `).join('');
                searchResults.classList.add('active');
                
                // Add click handlers
                searchResults.querySelectorAll('.search-result-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const zoneId = parseInt(item.dataset.zoneId);
                        console.log('Selected zone:', zoneId);
                        searchResults.classList.remove('active');
                        zoneSearch.value = '';
                        // TODO: Zoom to zone on map
                    });
                });
            } else {
                searchResults.innerHTML = '<div class="search-result-item">No zones found</div>';
                searchResults.classList.add('active');
            }
        });
        
        // Close search when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults.classList.remove('active');
            }
        });
    }
});