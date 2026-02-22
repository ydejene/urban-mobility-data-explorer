// Chart management with tab switching
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.API_BASE || 'http://127.0.0.1:5000/api';
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const boroughFilter = document.getElementById('boroughFilter');
    const chartLoadingOverlay = document.getElementById('chartLoadingOverlay');
    
    let activeTab = 'rush-hour';

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTab = btn.dataset.tab;
            loadChart();
        });
    });

    // Load Rush Hour chart (hourly trip volume)
    async function loadHourlyChart() {
        chartLoadingOverlay.classList.remove('hidden');
        
        try {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            const borough = boroughFilter.value;

            const url = new URL(`${API_BASE}/trips/hourly`);
            if (startDate) url.searchParams.append('start_date', startDate);
            if (endDate) url.searchParams.append('end_date', endDate);
            if (borough !== 'all') url.searchParams.append('borough', borough);
            if (window.activeZoneId) url.searchParams.append('zone_id', window.activeZoneId);

            const resp = await fetch(url);
            const data = await resp.json();

            // Destroy existing chart
            const chartStatus = Chart.getChart("mainChart");
            if (chartStatus !== undefined) chartStatus.destroy();

            const ctx = document.getElementById('mainChart').getContext('2d');

            // Find peak hour
            const hours = Object.keys(data);
            const counts = Object.values(data).map(d => d.trips);
            const maxVal = Math.max(...counts);

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: hours.map(h => `${h}:00`),
                    datasets: [{
                        label: 'Trip Volume',
                        data: counts,
                        backgroundColor: counts.map(c => c === maxVal && c > 0 ? '#f0883e' : '#58a6ff'),
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const hour = context.label.split(':')[0];
                                    const speed = data[hour].speed;
                                    return [
                                        `Trips: ${context.raw}`,
                                        `Avg Speed: ${speed} MPH` + (speed < 5 && context.raw > 0 ? ' (⚠️ Congested)' : '')
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        x: { 
                            grid: { display: false }
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Error loading hourly chart:', err);
        } finally {
            chartLoadingOverlay.classList.add('hidden');
        }
    }

    // Load Congestion Index chart
    async function loadCongestionChart() {
        chartLoadingOverlay.classList.remove('hidden');
        
        try {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            const borough = boroughFilter.value;
            
            const url = new URL(`${API_BASE}/trips/revenue`);
            if (startDate) url.searchParams.append('start_date', startDate);
            if (endDate) url.searchParams.append('end_date', endDate);
            if (borough !== 'all') url.searchParams.append('borough', borough);
            if (window.activeZoneId) url.searchParams.append('zone_id', window.activeZoneId);

            const resp = await fetch(url);
            const data = await resp.json();

            // Destroy existing chart
            const chartStatus = Chart.getChart("mainChart");
            if (chartStatus !== undefined) chartStatus.destroy();

            const ctx = document.getElementById('mainChart').getContext('2d');
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(data),
                    datasets: [{
                        label: 'Congestion Index (Lower is Better)',
                        data: Object.values(data),
                        backgroundColor: '#ff7b72',
                        borderColor: '#ff7b72',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: { 
                        y: { 
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        x: { 
                            grid: { display: false }
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Error loading congestion chart:', err);
        } finally {
            chartLoadingOverlay.classList.add('hidden');
        }
    }

    // Main chart loader
    async function loadChart() {
        if (activeTab === 'rush-hour') {
            await loadHourlyChart();
        } else {
            await loadCongestionChart();
        }
    }

    // Make loadChart available globally
    window.loadChart = loadChart;
    
    // Initial load
    loadChart();
});