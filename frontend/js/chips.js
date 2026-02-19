// Filter chips functionality
document.addEventListener('DOMContentLoaded', () => {
    const chips = document.querySelectorAll('.chip');
    const boroughSelect = document.getElementById('borough-select');
    
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Remove active class from all chips
            chips.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked chip
            chip.classList.add('active');
            
            // Get filter value
            const filter = chip.dataset.filter;
            
            // Update borough select to match
            if (boroughSelect) {
                if (filter === 'all') {
                    boroughSelect.value = 'all';
                } else if (filter === 'manhattan') {
                    boroughSelect.value = 'Manhattan';
                } else if (filter === 'brooklyn') {
                    boroughSelect.value = 'Brooklyn';
                } else if (filter === 'queens') {
                    boroughSelect.value = 'Queens';
                }
                
                // Trigger change event to update map
                const event = new Event('change');
                boroughSelect.dispatchEvent(event);
            }
            
            console.log(`Filter chip clicked: ${filter}`);
        });
    });
});