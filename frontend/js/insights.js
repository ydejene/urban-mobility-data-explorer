// Report generation functionality
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.API_BASE || 'http://127.0.0.1:5000/api';
    
    const generateReportBtn = document.getElementById('generateReportBtn');
    const reportModal = document.getElementById('reportModal');
    const closeReportBtn = document.getElementById('closeReportBtn');
    const printReportBtn = document.getElementById('printReportBtn');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const boroughFilter = document.getElementById('boroughFilter');
    
    let reportChartInstance = null;

    // Generate diagnostic report
    async function generateReport() {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const borough = boroughFilter.value;

        const url = new URL(`${API_BASE}/report`);
        if (startDate) url.searchParams.append('start_date', startDate);
        if (endDate) url.searchParams.append('end_date', endDate);
        if (borough !== 'all') url.searchParams.append('borough', borough);
        if (window.activeZoneId) url.searchParams.append('zone_id', window.activeZoneId);

        try {
            generateReportBtn.disabled = true;
            generateReportBtn.textContent = "Processing...";

            const resp = await fetch(url);
            if (!resp.ok) throw new Error("Report failed");
            const data = await resp.json();

            // Populate metadata
            document.getElementById('reportMetadata').innerHTML = `
                Scope: <strong>${data.metadata.scope}</strong> | 
                Period: <strong>${data.metadata.period}</strong> | 
                Generated: <strong>${data.metadata.generatedAt}</strong>
                ${data.metadata.boroughMetadata && data.metadata.boroughMetadata.zoneCount ? 
                    ` | Total Zones: <strong>${data.metadata.boroughMetadata.zoneCount}</strong>` : ''}
            `;

            // Populate summary
            const summaryGrid = document.getElementById('reportSummary');
            const metrics = [
                { label: 'Total Trips', val: data.summary.totalTrips.toLocaleString() },
                { label: 'Total Passengers', val: data.summary.totalPassengers.toLocaleString() },
                { label: 'Revenue', val: `$${data.summary.totalRevenue.toLocaleString()}` },
                { label: 'Avg Speed', val: `${data.summary.avgSpeed} MPH` },
                { label: 'Avg Distance', val: `${data.summary.avgDistance} MI` },
                { label: 'Detected Noise', val: data.summary.totalAnomalies.toLocaleString() },
                { label: 'Health Score', val: `${data.summary.systemHealth}%` },
            ];

            if (data.metadata.isZoneReport) {
                metrics.push({ label: 'Zone Speed', val: `${data.metadata.comparison.zoneSpeed} MPH` });
                metrics.push({ label: 'Borough Speed', val: `${data.metadata.comparison.boroughSpeed} MPH` });
                metrics.push({ label: 'Var vs Borough', val: `${data.metadata.comparison.diff}%` });
            }

            if (data.metadata.boroughMetadata && data.metadata.boroughMetadata.pickupPassengers !== undefined) {
                metrics.push({ label: 'Total Zones', val: data.metadata.boroughMetadata.zoneCount });
                metrics.push({ label: 'PU Passengers', val: data.metadata.boroughMetadata.pickupPassengers.toLocaleString() });
                metrics.push({ label: 'DO Passengers', val: data.metadata.boroughMetadata.dropoffPassengers.toLocaleString() });
            }

            summaryGrid.innerHTML = metrics.map(m => `
                <div class="report-stat-card">
                    <small>${m.label}</small>
                    <strong>${m.val}</strong>
                </div>
            `).join('');

            // Populate top zones
            const reportTableTitleArea = document.querySelector('#reportTopZones');
            if (reportTableTitleArea) {
                const h4 = reportTableTitleArea.previousElementSibling;
                if (h4 && h4.tagName === 'H4') {
                    h4.textContent = data.metadata.isZoneReport ? "Top Destination Zones" : "Top Zones by Trip Volume";
                }
            }

            const tbody = document.querySelector('#reportTopZones tbody');
            tbody.innerHTML = data.topZones.map(z => `
                <tr>
                    <td><strong>${z.zone}</strong></td>
                    <td>${z.borough}</td>
                    <td>${z.trips.toLocaleString()}</td>
                    <td>${z.speed} MPH</td>
                </tr>
            `).join('');

            // Populate rush hour
            const rushHourGrid = document.getElementById('reportRushHour');
            const rh = data.rushHour;
            const startHour = rh.hour.toString().padStart(2, '0') + ":00";
            const endHour = ((rh.hour + 1) % 24).toString().padStart(2, '0') + ":00";

            rushHourGrid.innerHTML = `
                <div class="report-stat-card">
                    <small>Peak Period</small>
                    <strong>${startHour} - ${endHour}</strong>
                </div>
                <div class="report-stat-card">
                    <small>Peak Throughput</small>
                    <strong>${rh.trips.toLocaleString()} trips/hr</strong>
                </div>
                <div class="report-stat-card">
                    <small>Peak Avg Speed</small>
                    <strong>${rh.avgSpeed} MPH</strong>
                </div>
            `;

            // Congestion alert (citywide only)
            const congestionAlert = document.getElementById('reportCongestionAlert');
            if (data.metadata.isCitywide && rh.congestionImpact !== null) {
                const color = rh.congestionImpact < -15 ? "#cf222e" : "#f0883e";
                const label = rh.congestionImpact < -15 ? "CRITICAL CONGESTION" : "HEAVY TRAFFIC";
                congestionAlert.innerHTML = `
                    <div class="report-stat-card" style="border-left: 4px solid ${color};">
                        <strong style="color: ${color};">${label}</strong>
                        <p style="margin:0; font-size:0.85rem; color:#57606a;">
                            Peak mobility speed is <strong>${Math.abs(rh.congestionImpact)}% lower</strong> than daily average.
                        </p>
                    </div>
                `;
            } else {
                congestionAlert.innerHTML = "";
            }

            // Populate coverage gaps
            const gapsList = document.getElementById('reportGaps');
            const displayGaps = (data.metadata.boroughMetadata && data.metadata.boroughMetadata.underservedZones)
                ? data.metadata.boroughMetadata.underservedZones
                : data.coverageGaps;

            if (displayGaps && displayGaps.length > 0) {
                gapsList.innerHTML = displayGaps.map(g => `
                    <div class="report-stat-card" style="margin-bottom: 0.5rem; border-left: 4px solid #f0883e;">
                        <strong>${g.zone} (${g.borough || data.metadata.scope})</strong>
                        <p style="margin:0; font-size:0.85rem; color:#57606a;">
                            ${g.ratio ? `Drop-offs exceed pick-ups by ${g.ratio}x.` : 'Underserved area.'}
                        </p>
                    </div>
                `).join('');
            } else {
                gapsList.innerHTML = "<p>No critical coverage gaps detected.</p>";
            }

            // Populate noise analysis
            const noiseList = document.getElementById('reportNoise');
            const noiseItems = [];
            
            if (data.summary.anomalyDetails.speed > 0) {
                noiseItems.push({
                    title: `Speed Violations (${data.summary.anomalyDetails.speed})`,
                    desc: "Trips with speeds exceeding 80 MPH, indicating data errors or violations."
                });
            }
            if (data.summary.anomalyDetails.fare > 0) {
                noiseItems.push({
                    title: `Suspicious Fare/Distance (${data.summary.anomalyDetails.fare})`,
                    desc: "Short trips (< 1 mi) with high fares (> $100), suggesting meter issues."
                });
            }

            if (noiseItems.length > 0) {
                noiseList.innerHTML = noiseItems.map(n => `
                    <div class="report-stat-card" style="margin-bottom: 0.5rem; border-left: 4px solid #cf222e;">
                        <strong>${n.title}</strong>
                        <p style="margin:0; font-size:0.85rem; color:#57606a;">${n.desc}</p>
                    </div>
                `).join('');
            } else {
                noiseList.innerHTML = "<p>No significant data noise detected.</p>";
            }

            // Render rush hour chart
            renderReportChart(data.rushHour);

            // Show modal
            reportModal.classList.add('open');

        } catch (err) {
            console.error("Report generation error:", err);
            alert("Failed to generate report. Check server connection.");
        } finally {
            generateReportBtn.disabled = false;
            generateReportBtn.textContent = "Generate Report";
        }
    }

    // Render rush hour trend chart
    function renderReportChart(rushHourData) {
        const ctx = document.getElementById('reportRushHourChart').getContext('2d');

        if (reportChartInstance) {
            reportChartInstance.destroy();
        }

        const trend = rushHourData.trend;
        const hours = Object.keys(trend);
        const counts = Object.values(trend).map(d => d.trips);
        const peakHour = rushHourData.hour;

        reportChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hours.map(h => `${h}:00`),
                datasets: [{
                    label: 'Hourly Throughput',
                    data: counts,
                    backgroundColor: hours.map(h => parseInt(h) === peakHour ? '#f0883e' : '#e1e4e8'),
                    borderColor: hours.map(h => parseInt(h) === peakHour ? '#f0883e' : '#d1d5da'),
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f0f0f0' },
                        ticks: { color: '#57606a', font: { size: 10 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#57606a', font: { size: 10 } }
                    }
                }
            }
        });
    }

    // Event listeners
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReport);
    }

    if (closeReportBtn) {
        closeReportBtn.addEventListener('click', () => reportModal.classList.remove('open'));
    }

    if (printReportBtn) {
        printReportBtn.addEventListener('click', () => window.print());
    }

    // Close on overlay click
    if (reportModal) {
        reportModal.addEventListener('click', (e) => {
            if (e.target === reportModal) reportModal.classList.remove('open');
        });
    }
});