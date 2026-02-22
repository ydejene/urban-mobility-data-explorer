// Quick filter chips functionality
document.addEventListener('DOMContentLoaded', () => {
    const emptyState = document.getElementById('emptyState');
    let activeFilter = 'all';
    
    // Get coverage gaps from global scope
    function getGapZones() {
        return window.gapZones || [];
    }

    // Filter chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            activeFilter = chip.dataset.filter;
            applyQuickFilter(activeFilter);
        });
    });

    // Apply quick filter to map
    function applyQuickFilter(filter) {
        if (!window.geoLayer) return;

        const gapZones = getGapZones();
        let visibleCount = 0;

        window.geoLayer.eachLayer(layer => {
            const zoneName = layer.feature.properties.zone;
            const isGap = gapZones.find(g => g.zone === zoneName);
            let show = false;

            if (filter === 'all') {
                show = true;
            } else if (filter === 'underserved') {
                show = !!isGap;
            } else if (filter === 'normal') {
                show = !isGap;
            }

            if (show) {
                layer.setStyle({ 
                    opacity: 1, 
                    fillOpacity: isGap ? 0.6 : 0.3 
                });
                visibleCount++;
            } else {
                layer.setStyle({ 
                    opacity: 0.1, 
                    fillOpacity: 0.05 
                });
            }
        });

        // Show empty state if no zones visible
        if (visibleCount === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
        }
    }

    // Make available globally for updates when gaps change
    window.applyQuickFilter = applyQuickFilter;
});