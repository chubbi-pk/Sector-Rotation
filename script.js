// Sector ETF definitions
const sectors = [
    { symbol: 'XLK', name: 'Technology', color: '#8b5cf6' },
    { symbol: 'XLU', name: 'Utilities', color: '#06b6d4' },
    { symbol: 'XLE', name: 'Energy', color: '#f97316' },
    { symbol: 'XLC', name: 'Communication', color: '#ec4899' },
    { symbol: 'XLB', name: 'Materials', color: '#84cc16' },
    { symbol: 'XLP', name: 'Consumer Staples', color: '#14b8a6' },
    { symbol: 'XLRE', name: 'Real Estate', color: '#f59e0b' },
    { symbol: 'XLY', name: 'Consumer Discretionary', color: '#10b981' },
    { symbol: 'XLI', name: 'Industrials', color: '#6366f1' },
    { symbol: 'XLV', name: 'Healthcare', color: '#ef4444' },
    { symbol: 'XLF', name: 'Financials', color: '#3b82f6' }
];

// Global variables
let canvas, ctx;
let trailLength = 12;
let sectorData = {};
let animationFrame;

// Initialize the dashboard
function init() {
    canvas = document.getElementById('rrgChart');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize sector data
    initializeSectorData();
    
    // Event listeners
    document.getElementById('trailLength').addEventListener('input', (e) => {
        trailLength = parseInt(e.target.value);
        document.getElementById('trailValue').textContent = trailLength;
        drawChart();
    });
    
    document.getElementById('refreshBtn').addEventListener('click', () => {
        updateSectorData();
        drawChart();
        updateTable();
    });
    
    document.getElementById('period').addEventListener('change', () => {
        updateSectorData();
        drawChart();
        updateTable();
    });
    
    // Initial draw
    drawChart();
    updateTable();
    
    // Auto-refresh every 30 seconds (simulating real-time updates)
    setInterval(() => {
        updateSectorData();
        drawChart();
        updateTable();
    }, 30000);
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width - 80;
    canvas.height = 600;
    if (ctx) drawChart();
}

// Initialize sector data with historical trails
function initializeSectorData() {
    sectors.forEach(sector => {
        sectorData[sector.symbol] = {
            ...sector,
            trail: generateInitialTrail(),
            rsRatio: 100 + (Math.random() - 0.5) * 40,
            rsMomentum: 100 + (Math.random() - 0.5) * 40
        };
    });
}

// Generate initial trail data
function generateInitialTrail() {
    const trail = [];
    let rsRatio = 100 + (Math.random() - 0.5) * 30;
    let rsMomentum = 100 + (Math.random() - 0.5) * 30;
    
    for (let i = 0; i < trailLength; i++) {
        // Simulate rotation movement
        rsRatio += (Math.random() - 0.5) * 5;
        rsMomentum += (Math.random() - 0.5) * 5;
        
        // Keep values in reasonable range
        rsRatio = Math.max(70, Math.min(130, rsRatio));
        rsMomentum = Math.max(70, Math.min(130, rsMomentum));
        
        trail.push({ rsRatio, rsMomentum });
    }
    
    return trail;
}

// Update sector data (simulating new data)
function updateSectorData() {
    sectors.forEach(sector => {
        const data = sectorData[sector.symbol];
        
        // Shift trail
        data.trail.shift();
        
        // Add new point with realistic rotation movement
        const lastPoint = data.trail[data.trail.length - 1];
        let newRsRatio = lastPoint.rsRatio + (Math.random() - 0.5) * 3;
        let newRsMomentum = lastPoint.rsMomentum + (Math.random() - 0.5) * 4;
        
        // Simulate clockwise rotation tendency
        const quadrant = getQuadrant(lastPoint.rsRatio, lastPoint.rsMomentum);
        if (quadrant === 'leading') {
            newRsMomentum -= Math.random() * 2; // Tend to move toward weakening
        } else if (quadrant === 'weakening') {
            newRsRatio -= Math.random() * 2; // Tend to move toward lagging
        } else if (quadrant === 'lagging') {
            newRsMomentum += Math.random() * 2; // Tend to move toward improving
        } else if (quadrant === 'improving') {
            newRsRatio += Math.random() * 2; // Tend to move toward leading
        }
        
        // Keep values in reasonable range
        newRsRatio = Math.max(75, Math.min(125, newRsRatio));
        newRsMomentum = Math.max(75, Math.min(125, newRsMomentum));
        
        data.trail.push({ rsRatio: newRsRatio, rsMomentum: newRsMomentum });
        data.rsRatio = newRsRatio;
        data.rsMomentum = newRsMomentum;
    });
}

// Get quadrant for RS values
function getQuadrant(rsRatio, rsMomentum) {
    if (rsRatio >= 100 && rsMomentum >= 100) return 'leading';
    if (rsRatio >= 100 && rsMomentum < 100) return 'weakening';
    if (rsRatio < 100 && rsMomentum < 100) return 'lagging';
    if (rsRatio < 100 && rsMomentum >= 100) return 'improving';
}

// Get quadrant color
function getQuadrantColor(quadrant) {
    const colors = {
        leading: '#10b981',
        weakening: '#f59e0b',
        lagging: '#ef4444',
        improving: '#3b82f6'
    };
    return colors[quadrant] || '#6b7280';
}

// Draw the RRG chart
function drawChart() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 4; // Scale factor for positioning
    
    // Draw quadrant backgrounds
    drawQuadrants(centerX, centerY);
    
    // Draw grid lines
    drawGrid(centerX, centerY, scale);
    
    // Draw axes
    drawAxes(centerX, centerY);
    
    // Draw sector trails and points
    sectors.forEach(sector => {
        const data = sectorData[sector.symbol];
        drawSectorTrail(data, centerX, centerY, scale);
    });
    
    // Draw sector labels and current points
    sectors.forEach(sector => {
        const data = sectorData[sector.symbol];
        drawSectorPoint(data, centerX, centerY, scale);
    });
}

function drawQuadrants(centerX, centerY) {
    // Leading (top-right)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.fillRect(centerX, 0, centerX, centerY);
    
    // Weakening (bottom-right)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    ctx.fillRect(centerX, centerY, centerX, centerY);
    
    // Lagging (bottom-left)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.fillRect(0, centerY, centerX, centerY);
    
    // Improving (top-left)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(0, 0, centerX, centerY);
    
    // Draw quadrant labels
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText('LEADING', centerX + 20, 30);
    
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('WEAKENING', centerX + 20, canvas.height - 20);
    
    ctx.fillStyle = '#ef4444';
    ctx.fillText('LAGGING', 20, canvas.height - 20);
    
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('IMPROVING', 20, 30);
}

function drawGrid(centerX, centerY, scale) {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = -25; i <= 25; i += 5) {
        const x = centerX + (i * scale);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = -25; i <= 25; i += 5) {
        const y = centerY - (i * scale);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawAxes(centerX, centerY) {
    // Main axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    
    // X-axis (RS-Ratio)
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    
    // Y-axis (RS-Momentum)
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    
    // Axis labels
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#374151';
    
    // RS-Ratio label
    ctx.fillText('RS-Ratio →', canvas.width - 100, centerY - 10);
    ctx.fillText('100', centerX + 5, centerY - 10);
    
    // RS-Momentum label
    ctx.save();
    ctx.translate(centerX + 15, 60);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('RS-Momentum →', 0, 0);
    ctx.restore();
    ctx.fillText('100', centerX + 5, centerY + 15);
    
    // Draw center crosshair
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.stroke();
}

function drawSectorTrail(data, centerX, centerY, scale) {
    const trail = data.trail;
    const quadrant = getQuadrant(data.rsRatio, data.rsMomentum);
    const color = getQuadrantColor(quadrant);
    
    // Calculate distance from center for line width
    const distanceFromCenter = Math.sqrt(
        Math.pow(data.rsRatio - 100, 2) + Math.pow(data.rsMomentum - 100, 2)
    );
    const lineWidth = Math.max(1, Math.min(6, distanceFromCenter / 5));
    
    // Draw trail line
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    trail.forEach((point, index) => {
        const x = centerX + (point.rsRatio - 100) * scale;
        const y = centerY - (point.rsMomentum - 100) * scale;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    // Draw trail dots
    ctx.fillStyle = color;
    trail.forEach((point, index) => {
        const x = centerX + (point.rsRatio - 100) * scale;
        const y = centerY - (point.rsMomentum - 100) * scale;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function drawSectorPoint(data, centerX, centerY, scale) {
    const x = centerX + (data.rsRatio - 100) * scale;
    const y = centerY - (data.rsMomentum - 100) * scale;
    const quadrant = getQuadrant(data.rsRatio, data.rsMomentum);
    const color = getQuadrantColor(quadrant);
    
    // Draw current position dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw white border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw symbol label
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    ctx.fillText(data.symbol, x, y - 15);
}

// Update the table
function updateTable() {
    const tbody = document.getElementById('sectorsTableBody');
    tbody.innerHTML = '';
    
    // Sort sectors by distance from center (largest first)
    const sortedSectors = [...sectors].sort((a, b) => {
        const distA = Math.sqrt(
            Math.pow(sectorData[a.symbol].rsRatio - 100, 2) + 
            Math.pow(sectorData[a.symbol].rsMomentum - 100, 2)
        );
        const distB = Math.sqrt(
            Math.pow(sectorData[b.symbol].rsRatio - 100, 2) + 
            Math.pow(sectorData[b.symbol].rsMomentum - 100, 2)
        );
        return distB - distA;
    });
    
    sortedSectors.forEach(sector => {
        const data = sectorData[sector.symbol];
        const quadrant = getQuadrant(data.rsRatio, data.rsMomentum);
        const distance = Math.sqrt(
            Math.pow(data.rsRatio - 100, 2) + 
            Math.pow(data.rsMomentum - 100, 2)
        );
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${data.symbol}</strong></td>
            <td>${data.name}</td>
            <td>${data.rsRatio.toFixed(2)}</td>
            <td>${data.rsMomentum.toFixed(2)}</td>
            <td><span class="quadrant-badge ${quadrant}">${quadrant.toUpperCase()}</span></td>
            <td>${distance.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Start the dashboard when page loads
window.addEventListener('load', init);
