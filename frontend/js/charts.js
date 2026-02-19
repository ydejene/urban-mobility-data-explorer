// Charts with API integration
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = 'http://127.0.0.1:5000/api';
    
    // Fetch and render trips by hour chart
    async function loadTripsChart() {
        try {
            const response = await fetch(`${API_BASE}/trips/hourly`);
            
            if (!response.ok) {
                console.error('API not ready, using sample data');
                renderTripsChart(null);
                return;
            }
            
            const data = await response.json();
            renderTripsChart(data);
            
        } catch (error) {
            console.error('Error loading trips data:', error);
            renderTripsChart(null);
        }
    }
    
    function renderTripsChart(apiData) {
        // Use API data if available, otherwise use sample data
        const hourlyData = apiData || {
            labels: ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'],
            datasets: [{
                label: 'Number of Trips',
                data: [120, 80, 200, 450, 380, 520, 680, 550],
                backgroundColor: '#FFC107',
                borderColor: '#1e3a5f',
                borderWidth: 1
            }]
        };
        
        const ctx = document.getElementById('trips-by-hour-chart').getContext('2d');
        
        const tripsChart = new Chart(ctx, {
            type: 'bar',
            data: hourlyData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Trips'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Hour of Day'
                        }
                    }
                }
            }
        });
        
        console.log('Trips by hour chart created');
    }
    
    // Load chart on startup
    loadTripsChart();
});