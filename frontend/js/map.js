// Map initialization and zone management
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.API_BASE || 'http://127.0.0.1:5000/api';
    
    // Create map centered on NYC
    const map = L.map('map').setView([40.7128, -74.0060], 11);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const boroughFilter = document.getElementById('boroughFilter');
    const boroughMenu = document.getElementById('boroughMenu');
    const selectedBoroughSpan = document.getElementById('selectedBorough');
    const hoverTooltip = document.getElementById('hoverTooltip');
    const loadingState = document.getElementById('loadingState');
    const detailsPanel = document.getElementById('detailsPanel');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const controlsSection = document.querySelector('.controls');

    // Prevent map scroll when using controls
    if (boroughMenu) L.DomEvent.disableScrollPropagation(boroughMenu);
    if (controlsSection) {
        L.DomEvent.disableScrollPropagation(controlsSection);
        L.DomEvent.disableClickPropagation(controlsSection);
    }

    let geoLayer;
    let gapZones = [];
    
    window.allZones = [];

    // Load zones from API
    async function loadZones() {
        console.log("Loading zones...");
        loadingState.classList.remove('hidden');
        
        try {
            const resp = await fetch(`${API_BASE}/zones`);
            if (!resp.ok) throw new Error(`API Error: ${resp.status}`);

            const zones = await resp.json();
            window.allZones = zones;

            const featureCollection = {
                type: 'FeatureCollection',
                features: zones.map(zone => ({
                    type: 'Feature',
                    geometry: zone.geometry,
                    properties: {
                        id: zone.id,
                        borough: zone.borough,
                        zone: zone.zone
                    }
                }))
            };

            geoLayer = L.geoJSON(featureCollection, {
                style: (feature) => ({
                    color: '#c9d1d9',
                    weight: 1,
                    fillOpacity: 0.1,
                    fillColor: '#58a6ff'
                }),
                onEachFeature: (feature, layer) => {
                    // Hover tooltip
                    layer.on('mouseover', (e) => {
                        // Hide tooltip if this zone's panel is already open
                        if (detailsPanel.classList.contains('open') && 
                            String(window.activeZoneId) === String(feature.properties.id)) {
                            hoverTooltip.classList.remove('visible');
                            return;
                        }

                        const props = feature.properties;
                        const gap = gapZones.find(g => g.zone === props.zone);
                        const status = gap ? 'Underserved' : '✓ Normal Coverage';

                        hoverTooltip.innerHTML = `
                            <strong>${props.zone}</strong><br>
                            <small>${props.borough}</small><br>
                            <small>${status}</small>
                        `;
                        hoverTooltip.classList.add('visible');
                        updateTooltipPosition(e.originalEvent);
                    });

                    layer.on('mousemove', (e) => {
                        if (hoverTooltip.classList.contains('visible')) {
                            updateTooltipPosition(e.originalEvent);
                        }
                    });

                    layer.on('mouseout', () => {
                        hoverTooltip.classList.remove('visible');
                    });

                    // Click to open details panel
                    layer.on('click', () => {
                        hoverTooltip.classList.remove('visible');
                        const props = feature.properties;
                        selectedBoroughSpan.textContent = props.zone;
                        boroughFilter.value = 'all';
                        
                        if (window.updateSummary) window.updateSummary(props.id);
                        if (window.loadChart) window.loadChart();
                        if (window.openDetailsPanel) window.openDetailsPanel(props);
                    });

                    layer.bindPopup(`<b>${feature.properties.zone}</b><br>${feature.properties.borough}`);
                }
            }).addTo(map);

            if (zones.length > 0) map.fitBounds(geoLayer.getBounds());

            loadingState.classList.add('hidden');
            loadCoverageGaps();
        } catch (err) {
            console.error('Error loading zones:', err);
            loadingState.classList.add('hidden');
        }
    }

    // Load coverage gaps (underserved areas)
    async function loadCoverageGaps() {
        try {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            const borough = boroughFilter.value;

            const url = new URL(`${API_BASE}/trips/gaps`);
            if (startDate) url.searchParams.append('start_date', startDate);
            if (endDate) url.searchParams.append('end_date', endDate);
            if (borough !== 'all') url.searchParams.append('borough', borough);
            if (window.activeZoneId) url.searchParams.append('zone_id', window.activeZoneId);

            const resp = await fetch(url);
            const gaps = await resp.json();
            console.log("Coverage gaps loaded:", gaps.length);
            gapZones = gaps;

            updateMapFilter();
        } catch (err) { 
            console.error("Error loading coverage gaps:", err); 
        }
    }

    // Update map styling based on filters
    function updateMapFilter() {
        if (!geoLayer) return;
        const selectedBorough = boroughFilter.value;
        const filteredLayers = [];

        geoLayer.eachLayer((layer) => {
            const props = layer.feature.properties;
            const borough = props.borough;
            const isActive = (selectedBorough === 'all' || borough === selectedBorough);

            const isGap = gapZones.find(g => g.zone === props.zone);
            const baseColor = isGap ? '#f0883e' : '#58a6ff';
            const outlineColor = isGap ? '#f0883e' : '#c9d1d9';

            if (isActive) {
                layer.setStyle({
                    color: outlineColor,
                    fillColor: baseColor,
                    weight: selectedBorough === 'all' ? (isGap ? 2 : 1) : 3,
                    fillOpacity: selectedBorough === 'all' ? (isGap ? 0.5 : 0.1) : 0.4
                });
                filteredLayers.push(layer);
            } else {
                layer.setStyle({
                    color: '#c9d1d9',
                    fillColor: baseColor,
                    weight: 0.5,
                    fillOpacity: 0.02
                });
            }
        });

        if (filteredLayers.length > 0 && selectedBorough !== 'all') {
            const group = L.featureGroup(filteredLayers);
            map.fitBounds(group.getBounds(), { padding: [20, 20] });
        } else if (selectedBorough === 'all' && geoLayer) {
            map.fitBounds(geoLayer.getBounds());
        }
    }

    // Helper: Update tooltip position
    function updateTooltipPosition(event) {
        const offset = 15;
        hoverTooltip.style.left = (event.clientX + offset) + 'px';
        hoverTooltip.style.top = (event.clientY + offset) + 'px';
    }

    // Helper: Zoom to specific zone
    function zoomToZone(zoneId) {
        geoLayer.eachLayer(layer => {
            if (layer.feature.properties.id === zoneId) {
                map.fitBounds(layer.getBounds(), { padding: [50, 50] });
                layer.openPopup();
                if (window.openDetailsPanel) {
                    window.openDetailsPanel(layer.feature.properties);
                }
            }
        });
    }

    // Focus mode toggle
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            document.body.classList.toggle('focus-mode');
            const isFocus = document.body.classList.contains('focus-mode');

            fullscreenBtn.innerHTML = isFocus
                ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
                : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;

            // Leaflet needs to recalculate size when container changes
            setTimeout(() => {
                map.invalidateSize();
                if (geoLayer) map.fitBounds(geoLayer.getBounds());
            }, 300);
        });
    }

    // Mobile filter toggle
    const mobileFilterToggle = document.getElementById('mobileFilterToggle');
    if (mobileFilterToggle && controlsSection) {
        mobileFilterToggle.addEventListener('click', () => {
            controlsSection.classList.toggle('open');
            mobileFilterToggle.classList.toggle('open');
            const isExpanded = controlsSection.classList.contains('open');
            mobileFilterToggle.querySelector('span').textContent = isExpanded ? 'Hide Filters' : 'Filter Options';
        });
    }

    // Make functions available globally
    window.loadCoverageGaps = loadCoverageGaps;
    window.updateMapFilter = updateMapFilter;
    window.zoomToZone = zoomToZone;
    window.geoLayer = geoLayer;
    
    // Initialize
    loadZones().then(() => {
        updateMapFilter();
    });
});