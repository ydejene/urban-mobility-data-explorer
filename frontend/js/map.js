// Initialize Leaflet map with zone data
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://127.0.0.1:5000/api';
    
    // Create map centered on NYC
    const map = L.map('map').setView([40.7128, -74.0060], 11);
    
    // Add dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);
    
    let geoLayer;
    
    // Fetch and display taxi zones
    async function loadZones() {
        try {
            console.log('Fetching taxi zones...');
            const response = await fetch(`${API_BASE}/zones`);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const zones = await response.json();
            console.log(`Loaded ${zones.length} zones`);
            
            // Create GeoJSON feature collection
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
            
            // Add zones to map
            geoLayer = L.geoJSON(featureCollection, {
                style: {
                    color: '#FFC107',
                    weight: 1,
                    fillOpacity: 0.1,
                    fillColor: '#FFC107'
                },
                onEachFeature: (feature, layer) => {
                    layer.bindPopup(`<b>${feature.properties.zone}</b><br>${feature.properties.borough}`);
                }
            }).addTo(map);
            
            // Fit map to show all zones
            if (zones.length > 0) {
                map.fitBounds(geoLayer.getBounds());
            }
            
        } catch (error) {
            console.error('Error loading zones:', error);
        }
    }
    
    // Load zones on startup
    loadZones();
});

// Borough filter functionality
    const boroughFilter = document.getElementById('borough-select');
    
    if (boroughFilter) {
        boroughFilter.addEventListener('change', () => {
            const selectedBorough = boroughFilter.value;
            
            if (!geoLayer) return;
            
            // Filter and style zones based on selection
            geoLayer.eachLayer(layer => {
                const borough = layer.feature.properties.borough;
                const isMatch = selectedBorough === 'all' || borough === selectedBorough;
                
                if (isMatch) {
                    layer.setStyle({
                        fillOpacity: 0.3,
                        weight: 2
                    });
                } else {
                    layer.setStyle({
                        fillOpacity: 0.05,
                        weight: 0.5
                    });
                }
            });
            
            console.log(`Filtered to: ${selectedBorough}`);
        });
    }