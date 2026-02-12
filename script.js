// Alpha Vantage API Configuration
const ALPHA_VANTAGE_API_KEY = 'DRZQJ20ESGYOO5XP';
const BENCHMARK_SYMBOL = 'SPY'; // S&P 500 ETF as benchmark

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
let benchmarkData = null;
let isLoadingData = false;
let lastUpdateTime = null;

// Initialize the dashboard
async function init() {
    canvas = document.getElementById('rrgChart');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Show loading message
    showLoadingMessage('Loading market data...');
    
    // Initialize sector data with real market data
    await initializeSectorData();
    
    // Event listeners
    document.getElementById('trailLength').addEventListener('input', (e) => {
        trailLength = parseInt(e.target.value);
        document.getElementById('trailValue').textContent = trailLength;
        drawChart();
    });
    
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        if (!isLoadingData) {
            showLoadingMessage('Refreshing data...');
            try {
                await fetchAllSectorData();
                drawChart();
                updateTable();
                updateLastUpdateTime();
            } catch (error) {
                console.error('Refresh error:', error);
                showTemporaryMessage('Refresh failed - using current data', 3000);
            }
            hideLoadingMessage();
        }
    });
    
    document.getElementById('period').addEventListener('change', async () => {
        // Just redraw with current data for now
        drawChart();
        updateTable();
    });
    
    // Initial draw
    drawChart();
    updateTable();
    updateLastUpdateTime();
    
    // Auto-refresh every 5 minutes during market hours
    setInterval(async () => {
        if (isMarketHours()) {
            console.log('Auto-refreshing data...');
            await fetchAllSectorData();
            drawChart();
            updateTable();
            updateLastUpdateTime();
        }
    }, 300000); // 5 minutes
}

function showLoadingMessage(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingMessage';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(102, 126, 234, 0.95);
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        font-size: 1.1rem;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    loadingDiv.textContent = message;
    
    const existing = document.getElementById('loadingMessage');
    if (existing) existing.remove();
    
    document.body.appendChild(loadingDiv);
}

function hideLoadingMessage() {
    const existing = document.getElementById('loadingMessage');
    if (existing) existing.remove();
}

function isMarketHours() {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    // Monday = 1, Friday = 5
    // Market hours: 9:30 AM - 4:00 PM EST (570 minutes - 960 minutes)
    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = 16 * 60; // 4:00 PM
    
    return day >= 1 && day <= 5 && totalMinutes >= marketOpen && totalMinutes <= marketClose;
}

function updateLastUpdateTime() {
    lastUpdateTime = new Date();
    const timeString = lastUpdateTime.toLocaleTimeString();
    const existingTime = document.getElementById('lastUpdate');
    if (existingTime) {
        existingTime.textContent = `Last updated: ${timeString}`;
    } else {
        const footer = document.querySelector('footer');
        const timeP = document.createElement('p');
        timeP.id = 'lastUpdate';
        timeP.style.fontWeight = '600';
        timeP.style.color = '#667eea';
        timeP.textContent = `Last updated: ${timeString}`;
        footer.insertBefore(timeP, footer.firstChild);
    }
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width - 80;
    canvas.height = 600;
    if (ctx) drawChart();
}

// Fetch daily price data from Alpha Vantage
async function fetchDailyData(symbol) {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (data['Error Message']) {
            console.error(`Error fetching ${symbol}:`, data['Error Message']);
            return null;
        }
        
        if (data['Note']) {
            console.warn('API call frequency limit reached. Using cached data.');
            return null;
        }
        
        const timeSeries = data['Time Series (Daily)'];
        if (!timeSeries) {
            console.error(`No time series data for ${symbol}`);
            return null;
        }
        
        // Convert to array of {date, close} objects
        const prices = Object.entries(timeSeries)
            .map(([date, values]) => ({
                date: new Date(date),
                close: parseFloat(values['4. close'])
            }))
            .sort((a, b) => a.date - b.date);
        
        return prices;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`Timeout fetching ${symbol}`);
        } else {
            console.error(`Error fetching ${symbol}:`, error);
        }
        return null;
    }
}

// Calculate price relative (sector / benchmark)
function calculatePriceRelative(sectorPrices, benchmarkPrices) {
    const relatives = [];
    
    // Match dates between sector and benchmark
    for (let i = 0; i < sectorPrices.length; i++) {
        const sectorDate = sectorPrices[i].date.toISOString().split('T')[0];
        const benchmarkPrice = benchmarkPrices.find(b => 
            b.date.toISOString().split('T')[0] === sectorDate
        );
        
        if (benchmarkPrice) {
            relatives.push({
                date: sectorPrices[i].date,
                value: sectorPrices[i].close / benchmarkPrice.close
            });
        }
    }
    
    return relatives;
}

// Calculate RS-Ratio (normalized ratio)
function calculateRSRatio(priceRelatives, period = 14) {
    if (priceRelatives.length < period) return [];
    
    const rsRatios = [];
    
    for (let i = period - 1; i < priceRelatives.length; i++) {
        const subset = priceRelatives.slice(Math.max(0, i - period + 1), i + 1);
        const sma = subset.reduce((sum, pr) => sum + pr.value, 0) / subset.length;
        const current = priceRelatives[i].value;
        
        // Normalize to 100
        const rsRatio = (current / sma) * 100;
        
        rsRatios.push({
            date: priceRelatives[i].date,
            value: rsRatio
        });
    }
    
    return rsRatios;
}

// Calculate RS-Momentum (rate of change of RS-Ratio)
function calculateRSMomentum(rsRatios, period = 14) {
    if (rsRatios.length < period) return [];
    
    const rsMomentum = [];
    
    for (let i = period; i < rsRatios.length; i++) {
        const current = rsRatios[i].value;
        const past = rsRatios[i - period].value;
        
        // Calculate momentum as percentage change, normalized to 100
        const momentum = ((current - past) / past) * 100 + 100;
        
        rsMomentum.push({
            date: rsRatios[i].date,
            value: momentum
        });
    }
    
    return rsMomentum;
}

// Initialize sector data with real market data
async function initializeSectorData() {
    isLoadingData = true;
    
    try {
        // First, initialize with fallback data immediately so page isn't blank
        console.log('Initializing with fallback data...');
        sectors.forEach(sector => {
            sectorData[sector.symbol] = {
                ...sector,
                trail: generateInitialTrail(),
                rsRatio: 100 + (Math.random() - 0.5) * 40,
                rsMomentum: 100 + (Math.random() - 0.5) * 40
            };
        });
        
        // Draw the chart immediately with fallback data
        hideLoadingMessage();
        drawChart();
        updateTable();
        
        // Now try to fetch real data in the background
        console.log('Attempting to fetch real market data...');
        showLoadingMessage('Fetching live market data... This may take 2-3 minutes');
        
        benchmarkData = await fetchDailyData(BENCHMARK_SYMBOL);
        
        if (benchmarkData) {
            console.log('Benchmark data loaded successfully');
            // Fetch all sector data
            await fetchAllSectorData();
            console.log('All sector data loaded successfully');
        } else {
            console.warn('Using fallback simulated data');
            showTemporaryMessage('Using simulated data (API unavailable)', 3000);
        }
        
    } catch (error) {
        console.error('Error initializing data:', error);
        showTemporaryMessage('Using simulated data (Error: ' + error.message + ')', 5000);
    } finally {
        isLoadingData = false;
        hideLoadingMessage();
    }
}

function showTemporaryMessage(message, duration) {
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(245, 158, 11, 0.95);
        color: white;
        padding: 15px 30px;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        z-index: 1001;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    msgDiv.textContent = message;
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
        msgDiv.remove();
    }, duration);
}

// Fetch data for all sectors
async function fetchAllSectorData() {
    isLoadingData = true;
    
    try {
        for (const sector of sectors) {
            console.log(`Fetching ${sector.symbol}...`);
            
            const sectorPrices = await fetchDailyData(sector.symbol);
            
            if (!sectorPrices) {
                console.warn(`Using fallback data for ${sector.symbol}`);
                // Use simulated data as fallback
                if (!sectorData[sector.symbol]) {
                    sectorData[sector.symbol] = {
                        ...sector,
                        trail: generateInitialTrail(),
                        rsRatio: 100 + (Math.random() - 0.5) * 40,
                        rsMomentum: 100 + (Math.random() - 0.5) * 40
                    };
                }
                continue;
            }
            
            // Calculate price relative
            const priceRelatives = calculatePriceRelative(sectorPrices, benchmarkData);
            
            // Calculate RS-Ratio
            const rsRatios = calculateRSRatio(priceRelatives, 14);
            
            // Calculate RS-Momentum
            const rsMomentumValues = calculateRSMomentum(rsRatios, 10);
            
            // Get the last N points for the trail
            const trailPoints = [];
            const startIndex = Math.max(0, rsMomentumValues.length - trailLength);
            
            for (let i = startIndex; i < rsMomentumValues.length; i++) {
                const rsRatioValue = rsRatios.find(r => 
                    r.date.getTime() === rsMomentumValues[i].date.getTime()
                )?.value || 100;
                
                trailPoints.push({
                    rsRatio: rsRatioValue,
                    rsMomentum: rsMomentumValues[i].value
                });
            }
            
            // Fill trail if we don't have enough points
            while (trailPoints.length < trailLength) {
                trailPoints.unshift({
                    rsRatio: 100,
                    rsMomentum: 100
                });
            }
            
            // Store sector data
            sectorData[sector.symbol] = {
                ...sector,
                trail: trailPoints,
                rsRatio: trailPoints[trailPoints.length - 1].rsRatio,
                rsMomentum: trailPoints[trailPoints.length - 1].rsMomentum
            };
            
            // Add delay between API calls to respect rate limits (5 calls per minute for free tier)
            await new Promise(resolve => setTimeout(resolve, 12000)); // 12 seconds between calls
        }
    } catch (error) {
        console.error('Error fetching sector data:', error);
    } finally {
        isLoadingData = false;
        hideLoadingMessage();
    }
}

// Generate initial trail data (fallback for when API fails)
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
