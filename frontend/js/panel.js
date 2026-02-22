// Side panel management for zone and borough details
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.API_BASE || 'http://127.0.0.1:5000/api';
    
    const detailsPanel = document.getElementById('detailsPanel');
    const boroughPanel = document.getElementById('boroughPanel');
    const closePanelBtn = document.getElementById('closePanelBtn');
    const closeBoroughPanelBtn = document.getElementById('closeBoroughPanelBtn');
    const openInsightsBtn = document.getElementById('openInsightsBtn');
    const hoverTooltip = document.getElementById('hoverTooltip');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const boroughFilter = document.getElementById('boroughFilter');
    
    let isUnderservedHighlighted = false;

    // Close button handlers
    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', () => {
            detailsPanel.classList.remove('open');
        });
    }

    if (closeBoroughPanelBtn) {
        closeBoroughPanelBtn.addEventListener('click', () => {
            boroughPanel.classList.remove('open');
        });
    }

    // View Insights button
    if (openInsightsBtn) {
        openInsightsBtn.addEventListener('click', () => {
            if (window.activeZoneId && window.allZones) {
                const zoneFeature = window.allZones.find(z => parseInt(z.id) === parseInt(window.activeZoneId));
                if (zoneFeature) {
                    openDetailsPanel(zoneFeature);
                } else {
                    const borough = boroughFilter.value === 'all' ? null : boroughFilter.value;
                    openBoroughPanel(borough);
                }
            } else {
                const borough = boroughFilter.value === 'all' ? null : boroughFilter.value;
                openBoroughPanel(borough);
            }
        });
    }

    // Open zone details panel
    async function openDetailsPanel(properties) {
        console.log('Opening panel for zone:', properties.zone);

        hoverTooltip.classList.remove('visible');
        boroughPanel.classList.remove('open');

        const panelContent = document.querySelector('#detailsPanel .panel-content');
        document.getElementById('panelZoneName').textContent = properties.zone;

        // Show loading state
        panelContent.innerHTML = `
            <div class="panel-section">
                <h4>Location</h4>
                <p>${properties.borough}</p>
            </div>
            <div class="panel-section loading-stats">
                <div class="spinner" style="width: 30px; height: 30px;"></div>
                <p>Loading statistics...</p>
            </div>
        `;

        detailsPanel.classList.add('open');

        // Fetch detailed stats
        try {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            const apiUrl = new URL(`${API_BASE}/zones/${properties.id}/stats`);
            if (startDate) apiUrl.searchParams.append('start_date', startDate);
            if (endDate) apiUrl.searchParams.append('end_date', endDate);

            const resp = await fetch(apiUrl);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

            const stats = await resp.json();

            panelContent.innerHTML = `
                <div class="panel-section">
                    <h4>Location</h4>
                    <p>${stats.borough}</p>
                </div>
                
                <div class="panel-section">
                    <h4>Trip Activity</h4>
                    <div class="stat-row">
                        <span>Pick-ups:</span>
                        <strong>${stats.pickupCount.toLocaleString()}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Drop-offs:</span>
                        <strong>${stats.dropoffCount.toLocaleString()}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Arriving Passengers:</span>
                        <strong>${stats.dropoffPassengers.toLocaleString()}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Departing Passengers:</span>
                        <strong>${stats.pickupPassengers.toLocaleString()}</strong>
                    </div>
                </div>
                
                <div class="panel-section">
                    <h4>Trip Metrics</h4>
                    <div class="stat-row">
                        <span>Avg Distance:</span>
                        <strong>${stats.avgDistance} mi</strong>
                    </div>
                    <div class="stat-row">
                        <span>Avg Duration:</span>
                        <strong>${stats.avgDuration} min</strong>
                    </div>
                    <div class="stat-row">
                        <span>Avg Speed:</span>
                        <strong>${stats.avgSpeed} mph</strong>
                    </div>
                    <div class="stat-row">
                        <span>Avg Fare:</span>
                        <strong>$${stats.avgFare}</strong>
                    </div>
                </div>
                
                <div class="panel-section">
                    <h4>Performance vs Borough</h4>
                    <div class="stat-row">
                        <span>Borough Avg Speed:</span>
                        <strong>${stats.boroughAvgSpeed} mph</strong>
                    </div>
                    <div class="stat-row">
                        <span>Speed Difference:</span>
                        <strong style="color: ${stats.speedComparison >= 0 ? '#3fb950' : '#ff7b72'}">
                            ${stats.speedComparison >= 0 ? '+' : ''}${stats.speedComparison}%
                        </strong>
                    </div>
                </div>
                
                <div class="panel-section">
                    <h4>Coverage Analysis</h4>
                    <p class="info-text">
                        ${stats.coverageRatio > 2
                            ? `This zone receives ${stats.coverageRatio}x more drop-offs than pick-ups, indicating potential service gaps.`
                            : stats.coverageRatio < 0.5
                                ? `This zone has ${(1 / stats.coverageRatio).toFixed(1)}x more pick-ups than drop-offs.`
                                : `This zone has balanced pick-up and drop-off activity (ratio: ${stats.coverageRatio}).`
                        }
                    </p>
                </div>
            `;

        } catch (err) {
            console.error('Error fetching zone stats:', err);
            panelContent.innerHTML = `
                <div class="panel-section">
                    <h4>Location</h4>
                    <p>${properties.borough}</p>
                </div>
                <div class="panel-section">
                    <p style="color: #ff7b72;">Failed to load statistics</p>
                    <small style="color: #8b949e;">${err.message}</small>
                </div>
            `;
        }
    }

    // Open borough analytics panel
    async function openBoroughPanel(boroughName) {
        const isCitywide = !boroughName || boroughName === 'all';
        const displayName = isCitywide ? 'Citywide' : boroughName;
        const fetchName = isCitywide ? 'all' : boroughName;
        
        console.log('Opening borough panel for:', displayName);
        
        const panelContent = document.getElementById('boroughPanelContent');
        document.getElementById('panelBoroughName').textContent = `${displayName} Analysis`;

        isUnderservedHighlighted = false;
        detailsPanel.classList.remove('open');

        panelContent.innerHTML = `
            <div class="loading-stats">
                <div class="spinner" style="width: 30px; height: 30px;"></div>
                <p>Aggregating data...</p>
            </div>
        `;

        boroughPanel.classList.add('open');

        try {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            const url = `${API_BASE}/boroughs/${fetchName}/stats?start_date=${startDate}&end_date=${endDate}`;

            const resp = await fetch(url);
            if (!resp.ok) throw new Error('API Failure');
            const stats = await resp.json();

            panelContent.innerHTML = `
                <div class="panel-section">
                    <h4>Overview</h4>
                    <div class="stat-row">
                        <span>Total Zones:</span>
                        <strong>${stats.zoneCount.toLocaleString()}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Total Trips:</span>
                        <strong>${stats.totalTrips.toLocaleString()}</strong>
                    </div>
                </div>

                <div class="panel-section">
                    <h4>Passenger Distribution</h4>
                    <div class="stat-row">
                        <span>Arriving (DO):</span>
                        <strong>${stats.dropoffPassengers.toLocaleString()}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Departing (PU):</span>
                        <strong>${stats.pickupPassengers.toLocaleString()}</strong>
                    </div>
                </div>

                <div class="panel-section">
                    <h4>Efficiency Metrics</h4>
                    <div class="stat-row">
                        <span>Avg Speed:</span>
                        <strong>${stats.avgSpeed} mph</strong>
                    </div>
                    <div class="stat-row">
                        <span>Avg Distance:</span>
                        <strong>${stats.avgDistance} mi</strong>
                    </div>
                </div>

                <div class="panel-section">
                    <h4>Network Health</h4>
                    <div class="stat-row underserved-row" title="Click to highlight zones">
                        <span>Underserved Zones:</span>
                        <strong style="color: ${stats.underservedCount > 0 ? '#f0883e' : '#3fb950'}">
                            ${stats.underservedCount}
                        </strong>
                    </div>
                </div>

                <div class="panel-section">
                    <h4>Top Activity Zones</h4>
                    ${stats.topZones.map(z => `
                        <div class="stat-row">
                            <span style="font-size: 0.8rem;">${z.zone}</span>
                            <strong>${z.trips} trips</strong>
                        </div>
                    `).join('')}
                </div>
            `;

            // Add underserved highlight toggle
            const underservedRow = panelContent.querySelector('.underserved-row');
            if (underservedRow && stats.underservedCount > 0) {
                const ids = stats.underservedZones.map(z => z.id);
                underservedRow.addEventListener('click', () => {
                    if (isUnderservedHighlighted) {
                        highlightBoroughZones(isCitywide ? 'all' : boroughName, []);
                        isUnderservedHighlighted = false;
                        underservedRow.style.backgroundColor = '';
                    } else {
                        highlightBoroughZones(isCitywide ? 'all' : boroughName, ids, '#b01f02');
                        isUnderservedHighlighted = true;
                        underservedRow.style.backgroundColor = 'rgba(176, 31, 2, 0.2)';
                    }
                });
            }
        } catch (err) {
            console.error('Error loading borough stats:', err);
            panelContent.innerHTML = `
                <div class="panel-section">
                    <p style="color: #ff7b72;">Error loading data</p>
                </div>
            `;
        }
    }

    // Highlight specific zones on map
    function highlightBoroughZones(boroughName, specialIds, color = '#f0883e') {
        if (!window.geoLayer) return;

        console.log('Highlighting zones in:', boroughName, specialIds);

        window.geoLayer.eachLayer((layer) => {
            const borough = layer.feature.properties.borough;
            const zoneId = layer.feature.properties.id;

            const isScopeMatch = boroughName === 'all' || borough === boroughName;

            if (isScopeMatch) {
                if (specialIds.includes(zoneId)) {
                    layer.setStyle({
                        weight: 4,
                        fillOpacity: 0.8,
                        fillColor: color,
                        color: color
                    });
                    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                        layer.bringToFront();
                    }
                } else {
                    layer.setStyle({
                        weight: 1.5,
                        fillOpacity: 0.15,
                        fillColor: '#58a6ff',
                        color: '#c9d1d9'
                    });
                }
            } else {
                layer.setStyle({
                    weight: 0.5,
                    fillOpacity: 0.05,
                    fillColor: '#58a6ff'
                });
            }
        });
    }

    // Make functions available globally
    window.openDetailsPanel = openDetailsPanel;
    window.openBoroughPanel = openBoroughPanel;
});