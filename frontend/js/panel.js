// Side panel functionality
document.addEventListener('DOMContentLoaded', () => {
    const detailsPanel = document.getElementById('detailsPanel');
    const closePanelBtn = document.getElementById('closePanelBtn');
    
    // Close panel button
    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', () => {
            detailsPanel.classList.remove('open');
        });
    }
    
    // Function to open panel with zone data
    window.openZoneDetails = function(zoneData) {
        const panelZoneName = document.getElementById('panelZoneName');
        const panelBorough = document.getElementById('panelBorough');
        const panelStatus = document.getElementById('panelStatus');
        
        if (panelZoneName) panelZoneName.textContent = zoneData.zone;
        if (panelBorough) panelBorough.textContent = zoneData.borough;
        if (panelStatus) panelStatus.textContent = '✓ Normal Coverage';
        
        detailsPanel.classList.add('open');
    };
});