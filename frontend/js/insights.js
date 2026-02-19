// Fetch and display key insights
document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = 'http://127.0.0.1:5000/api';
    
    async function loadInsights() {
        try {
            const response = await fetch(`${API_BASE}/trips/insights`);
            
            if (!response.ok) {
                console.log('Using placeholder insights');
                displayPlaceholderInsights();
                return;
            }
            
            const insights = await response.json();
            displayInsights(insights);
            
        } catch (error) {
            console.error('Error loading insights:', error);
            displayPlaceholderInsights();
        }
    }
    
    function displayInsights(data) {
        const congestionCard = document.querySelector('#insight-congestion p');
        const profitabilityCard = document.querySelector('#insight-profitability p');
        const tippingCard = document.querySelector('#insight-tipping p');
        
        if (data.congestion && congestionCard) {
            congestionCard.textContent = data.congestion;
        }
        
        if (data.profitability && profitabilityCard) {
            profitabilityCard.textContent = data.profitability;
        }
        
        if (data.tipping && tippingCard) {
            tippingCard.textContent = data.tipping;
        }
    }
    
    function displayPlaceholderInsights() {
        const congestionCard = document.querySelector('#insight-congestion p');
        const profitabilityCard = document.querySelector('#insight-profitability p');
        const tippingCard = document.querySelector('#insight-tipping p');
        
        if (congestionCard) {
            congestionCard.textContent = 'Rush hour traffic reduces average speed by 40% in Manhattan.';
        }
        
        if (profitabilityCard) {
            profitabilityCard.textContent = 'Airport trips generate 3x revenue per hour compared to local trips.';
        }
        
        if (tippingCard) {
            tippingCard.textContent = 'Manhattan passengers tip 15% more than outer borough passengers.';
        }
    }
    
    loadInsights();
});