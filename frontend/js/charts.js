// Wait for the page to fully load before running the code
document.addEventListener('DOMContentLoaded', function() {
    
    // Sample data for trips by hour (this will eventually come from your API)
    const hourlyData = {
        labels: ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'],
        datasets: [{
            label: 'Number of Trips',
            data: [120, 80, 200, 450, 380, 520, 680, 550],
            backgroundColor: '#FFC107',
            borderColor: '#1e3a5f',
            borderWidth: 1
        }]
    };

    // Get the canvas element where the chart will be drawn
    const ctx = document.getElementById('trips-by-hour-chart').getContext('2d');
    
    // Create the chart
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
    
    console.log('Trips by hour chart created successfully!');

    // Sample data for average fare by borough
    const boroughData = {
        labels: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'],
        datasets: [{
            label: 'Average Fare ($)',
            data: [18.50, 15.20, 16.80, 14.30, 22.50],
            backgroundColor: '#FFC107',
            borderColor: '#1e3a5f',
            borderWidth: 1
        }]
    };

    // Get the canvas element for the second chart
    const fareCtx = document.getElementById('fare-by-borough-chart').getContext('2d');
    
    // Create the fare chart
    const fareChart = new Chart(fareCtx, {
        type: 'bar',
        data: boroughData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Fare ($)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Borough'
                    }
                }
            }
        }
    });
    
    console.log('Fare by borough chart created successfully!');
});