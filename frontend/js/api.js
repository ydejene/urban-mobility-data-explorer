// Summary stats and API configuration
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://127.0.0.1:5000/api';
    
    // Make API_BASE available globally
    window.API_BASE = API_BASE;
    
    // Track active zone for filtering
    window.activeZoneId = null;
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const boroughFilter = document.getElementById('boroughFilter');
    
    // Fetch and update summary statistics
    async function updateSummary(zoneId = null) {
        try {
            window.activeZoneId = zoneId || window.activeZoneId;
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            const borough = boroughFilter.value;

            const url = new URL(`${API_BASE}/trips/summary`);
            if (startDate) url.searchParams.append('start_date', startDate);
            if (endDate) url.searchParams.append('end_date', endDate);

            // Zone ID takes priority over borough filter
            if (window.activeZoneId) {
                url.searchParams.append('zone_id', window.activeZoneId);
            } else if (borough !== 'all') {
                url.searchParams.append('borough', borough);
            }

            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`API Error: ${resp.status}`);

            const data = await resp.json();

            // Update metric cards
            const healthElem = document.getElementById('systemHealth');
            const speedElem = document.getElementById('avgMobilitySpeed');
            const anomaliesElem = document.getElementById('totalAnomalies');
            const tripsElem = document.getElementById('totalTripsHeader');
            const passengersElem = document.getElementById('totalPassengersHeader');

            healthElem.textContent = `${data.systemHealth || 0}%`;
            speedElem.textContent = `${data.avgMobilitySpeed || 0} MPH`;
            anomaliesElem.textContent = (data.totalAnomalies || 0).toLocaleString();
            tripsElem.textContent = (data.totalTrips || 0).toLocaleString();
            passengersElem.textContent = (data.totalPassengers || 0).toLocaleString();

            // Show/hide no data alert
            const noDataAlert = document.getElementById('noDataAlert');
            if (data.totalTrips === 0) {
                noDataAlert.classList.remove('hidden');
            } else {
                noDataAlert.classList.add('hidden');
            }

            // Update anomaly tooltip details
            if (data.anomalyDetails) {
                document.getElementById('speedAnomCount').textContent = data.anomalyDetails.speed.toLocaleString();
                document.getElementById('fareAnomCount').textContent = data.anomalyDetails.fare.toLocaleString();
            }

            // Remove loading state
            [healthElem, speedElem, anomaliesElem, tripsElem, passengersElem].forEach(el => {
                const card = el.closest('.stat-card');
                if (card) card.classList.remove('loading');
            });

            // Color-code health score
            const healthCard = healthElem.closest('.stat-card');
            if (data.systemHealth < 95) {
                healthCard.style.color = '#ff7b72';
            } else {
                healthCard.style.color = '#3fb950';
            }
        } catch (err) {
            console.error('Error fetching summary:', err);
        }
    }

    // Debounce helper
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Refresh dashboard when filters change
    const refreshDashboard = debounce(() => {
        updateSummary();
        if (window.loadChart) window.loadChart();
        if (window.loadCoverageGaps) window.loadCoverageGaps();
        console.log("Dashboard refreshed");
    }, 400);

    startDateInput.addEventListener('change', refreshDashboard);
    endDateInput.addEventListener('change', refreshDashboard);

    boroughFilter.addEventListener('change', () => {
        updateSummary();
        if (window.loadChart) window.loadChart();
        if (window.loadCoverageGaps) window.loadCoverageGaps();
        if (window.updateMapFilter) window.updateMapFilter();
    });

    // Make updateSummary available globally
    window.updateSummary = updateSummary;
    
    // Initial load
    updateSummary();
});