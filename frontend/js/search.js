// Zone search and hierarchical dropdown functionality
document.addEventListener('DOMContentLoaded', () => {
    const zoneSearch = document.getElementById('zoneSearch');
    const searchResults = document.getElementById('searchResults');
    const boroughDropdown = document.getElementById('boroughDropdown');
    const boroughTrigger = document.getElementById('boroughTrigger');
    const boroughMenu = document.getElementById('boroughMenu');
    const selectedBoroughSpan = document.getElementById('selectedBorough');
    const boroughFilter = document.getElementById('boroughFilter');

    // Zone search functionality
    if (zoneSearch && searchResults) {
        zoneSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            if (query.length === 0) {
                searchResults.classList.remove('active');
                return;
            }

            const matches = window.allZones.filter(zone =>
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

                        // Reset borough filter to show selected zone
                        boroughFilter.value = 'all';
                        selectedBoroughSpan.textContent = item.querySelector('strong').textContent;
                        document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));

                        if (window.updateMapFilter) window.updateMapFilter();
                        if (window.updateSummary) window.updateSummary(zoneId);
                        if (window.loadChart) window.loadChart();
                        if (window.zoomToZone) window.zoomToZone(zoneId);

                        searchResults.classList.remove('active');
                        zoneSearch.value = '';
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

    // Hierarchical borough dropdown
    if (boroughTrigger) {
        boroughTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            boroughDropdown.classList.toggle('open');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (boroughDropdown && !boroughDropdown.contains(e.target)) {
            boroughDropdown.classList.remove('open');
        }
    });

    // Populate zone submenus on hover
    document.querySelectorAll('.dropdown-item.has-submenu').forEach(item => {
        const boroughName = item.dataset.borough;
        const submenu = item.querySelector('.submenu');

        item.addEventListener('mouseenter', () => {
            if (!submenu.hasChildNodes() || submenu.querySelector('.submenu-loading')) {
                const zones = window.allZones.filter(z => z.borough === boroughName);

                if (zones.length === 0) {
                    if (window.allZones.length > 0) {
                        submenu.innerHTML = '<div class="submenu-loading">No zones found</div>';
                    } else {
                        submenu.innerHTML = '<div class="submenu-loading">Loading zones...</div>';
                    }
                } else {
                    submenu.innerHTML = zones.map(zone =>
                        `<div class="submenu-item" data-zone-id="${zone.id}" data-zone-name="${zone.zone}">
                            ${zone.zone}
                        </div>`
                    ).join('');

                    // Add click handlers to zone items
                    submenu.querySelectorAll('.submenu-item').forEach(zoneItem => {
                        zoneItem.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const zoneName = zoneItem.dataset.zoneName;
                            const zoneId = zoneItem.dataset.zoneId;

                            // Update dropdown display
                            selectedBoroughSpan.textContent = zoneName;
                            boroughDropdown.classList.remove('open');

                            // Reset borough filter to 'all'
                            boroughFilter.value = 'all';
                            document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));

                            if (window.updateMapFilter) window.updateMapFilter();
                            if (window.updateSummary) window.updateSummary(parseInt(zoneId));
                            if (window.loadChart) window.loadChart();
                            if (window.zoomToZone) window.zoomToZone(parseInt(zoneId));
                        });
                    });
                }
            }
        });
    });

    // Handle borough selection
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // If clicking submenu toggle, handle submenu expansion
            if (e.target.closest('.submenu-toggle')) {
                e.stopPropagation();

                const isOpen = item.classList.contains('submenu-open');
                document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('submenu-open'));

                if (!isOpen) {
                    item.classList.add('submenu-open');
                    const mouseEvent = new MouseEvent('mouseenter');
                    item.dispatchEvent(mouseEvent);
                }

                return;
            }

            // Don't handle clicks on submenu items here
            if (e.target.classList.contains('submenu-item')) return;

            const borough = item.dataset.borough;

            // Update active state
            document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Update display
            selectedBoroughSpan.textContent = item.querySelector('span').textContent;

            // Update hidden select
            boroughFilter.value = borough;

            // Close dropdown
            boroughDropdown.classList.remove('open');

            // Update data
            window.activeZoneId = null;
            if (window.updateSummary) window.updateSummary();
            if (window.loadChart) window.loadChart();
            if (window.updateMapFilter) window.updateMapFilter();
            if (window.openBoroughPanel) window.openBoroughPanel(borough === 'all' ? null : borough);
        });
    });
});