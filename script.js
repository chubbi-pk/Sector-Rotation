// Yahoo Finance API Configuration (Free, no API key needed!)
const DATA_SOURCE = 'yahoo'; // Using Yahoo Finance

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
let benchmarkData = null;
let isLoadingData = false;
let lastUpdateTime = null;
let lastFetchDate = null;
let dataMode = 'weekly'; // 'daily' or 'weekly'
const BENCHMARK_SYMBOL = 'SPY';

// Initialize the dashboard
async function init() {
    console.log('Initializing dashboard...');
    canvas = document.getElementById('rrgChart');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Show loading immediately - no demo data
    showLoadingMessage('Loading market data from Yahoo Finance...');
    
    // Event listeners
    document.getElementById('trailLength').addEventListener('input', (e) => {
        trailLength = parseInt(e.target.value);
        document.getElementById('trailValue').textContent = trailLength;
        drawChart();
    });
    
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        if (!isLoadingData) {
            await fetchMarketData();
        }
    });
    
    document.getElementById('period').addEventListener('change', async (e) => {
        dataMode = e.target.value === '1W' ? 'weekly' : 'daily';
        if (benchmarkData) {
            // Recalculate with new period
            showLoadingMessage('Recalculating...');
            await processAllSectorData();
            drawChart();
            updateTable();
            hideLoadingMessage();
        }
    });
    
    // Fetch real data immediately
    await fetchMarketData();
    
    console.log('Dashboard initialized successfully');
}

// Check if we should fetch new data
function checkShouldFetchData() {
    const cached = localStorage.getItem('rrgLastFetch');
    if (!cached) return true;
    
    const lastFetch = new Date(cached);
    const now = new Date();
    
    // If it's a new day, fetch new data
    if (lastFetch.toDateString() !== now.toDateString()) {
        return true;
    }
    
    // If after market close (4 PM ET) and haven't fetched today, fetch
    const currentHour = now.getHours();
    if (currentHour >= 16 && lastFetch.toDateString() === now.toDateString()) {
        return false; // Already fetched today after close
    }
    
    return false; // Use cached data from today
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width - 80;
    canvas.height = 600;
    if (ctx && Object.keys(sectorData).length > 0) drawChart();
}

// Main function to fetch market data
async function fetchMarketData() {
    isLoadingData = true;
    showLoadingMessage('Fetching market data from Yahoo Finance... please wait');
    
    try {
        // Fetch benchmark data first
        console.log('Fetching benchmark (SPY)...');
        benchmarkData = await fetchDailyData(BENCHMARK_SYMBOL);
        
        if (!benchmarkData || benchmarkData.length === 0) {
            hideLoadingMessage();
            showTemporaryMessage('❌ Failed to load benchmark data. Please check your internet connection and try again.', 5000);
            isLoadingData = false;
            return;
        }
        
        console.log(`✓ Benchmark loaded: ${benchmarkData.length} days of data`);
        
        // Initialize sector data structure
        sectors.forEach(sector => {
            if (!sectorData[sector.symbol]) {
                sectorData[sector.symbol] = {
                    ...sector,
                    trail: [],
                    rsRatio: 100,
                    rsMomentum: 100
                };
            }
        });
        
        console.log('Fetching sector data...');
        await fetchAllSectorData();
        
        // Check if we got at least some data
        const sectorsWithData = sectors.filter(s => sectorData[s.symbol] && sectorData[s.symbol].trail.length > 0);
        
        if (sectorsWithData.length === 0) {
            hideLoadingMessage();
            showTemporaryMessage('❌ Failed to load any sector data. Please try again.', 5000);
            isLoadingData = false;
            return;
        }
        
        // Save fetch timestamp
        localStorage.setItem('rrgLastFetch', new Date().toISOString());
        localStorage.setItem('rrgBenchmarkData', JSON.stringify(benchmarkData));
        
        drawChart();
        updateTable();
        updateLastUpdateTime('live');
        
        hideLoadingMessage();
        
        if (sectorsWithData.length < sectors.length) {
            showTemporaryMessage(`⚠️ Loaded ${sectorsWithData.length}/${sectors.length} sectors successfully`, 3000);
        } else {
            showTemporaryMessage('✅ All market data loaded successfully!', 3000);
        }
        
    } catch (error) {
        console.error('Error fetching market data:', error);
        hideLoadingMessage();
        showTemporaryMessage('❌ Error loading data: ' + error.message, 5000);
    } finally {
        isLoadingData = false;
    }
}

// Fetch daily price data from Yahoo Finance (FREE!)
async function fetchDailyData(symbol) {
    // Using Yahoo Finance query1 (more reliable for CORS)
    const period1 = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60); // 1 year ago
    const period2 = Math.floor(Date.now() / 1000); // now
    
    // Try multiple endpoints for better reliability
    const endpoints = [
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`,
        `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`
    ];
    
    for (const url of endpoints) {
        try {
            console.log(`Trying to fetch ${symbol} from Yahoo Finance...`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.warn(`HTTP ${response.status} for ${symbol}, trying next endpoint...`);
                continue;
            }
            
            const data = await response.json();
            
            if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
                console.warn(`No chart data for ${symbol}, trying next endpoint...`);
                continue;
            }
            
            const result = data.chart.result[0];
            
            if (!result.timestamp || !result.indicators || !result.indicators.quote || !result.indicators.quote[0]) {
                console.warn(`Invalid data structure for ${symbol}`);
                continue;
            }
            
            const timestamps = result.timestamp;
            const closes = result.indicators.quote[0].close;
            
            if (!timestamps || !closes || timestamps.length === 0) {
                console.warn(`Empty data for ${symbol}`);
                continue;
            }
            
            // Convert to our format
            const prices = timestamps.map((timestamp, index) => ({
                date: new Date(timestamp * 1000),
                close: closes[index]
            })).filter(p => p.close !== null && p.close !== undefined && !isNaN(p.close));
            
            if (prices.length > 0) {
                console.log(`✓ Successfully fetched ${prices.length} days for ${symbol}`);
                return prices;
            }
            
        } catch (error) {
            console.warn(`Error with endpoint for ${symbol}:`, error.message);
            continue;
        }
    }
    
    // If all endpoints fail, return null
    console.error(`Failed to fetch data for ${symbol} from all endpoints`);
    return null;
}

// Convert daily data to weekly closes (Friday closes)
function convertToWeeklyCloses(dailyPrices) {
    const weeklyPrices = [];
    let currentWeek = [];
    
    dailyPrices.forEach((price, index) => {
        const dayOfWeek = price.date.getDay();
        currentWeek.push(price);
        
        // If it's Friday or the last day in the data
        if (dayOfWeek === 5 || index === dailyPrices.length - 1) {
            // Use the last price of the week (Friday close or last available)
            weeklyPrices.push(currentWeek[currentWeek.length - 1]);
            currentWeek = [];
        } else if (dayOfWeek === 6 || dayOfWeek === 0) {
            // Skip weekends
            currentWeek = [];
        }
    });
    
    return weeklyPrices;
}

async function fetchAllSectorData() {
    let successCount = 0;
    
    for (const sector of sectors) {
        console.log(`Fetching ${sector.symbol}...`);
        
        const sectorPrices = await fetchDailyData(sector.symbol);
        
        if (!sectorPrices || sectorPrices.length === 0) {
            console.warn(`Failed to fetch ${sector.symbol}`);
            continue;
        }
        
        // Save to localStorage for caching
        try {
            localStorage.setItem(`rrg_${sector.symbol}`, JSON.stringify(sectorPrices));
        } catch (e) {
            console.warn(`Could not cache ${sector.symbol}:`, e.message);
        }
        
        // Process the data
        processSectorData(sector.symbol, sectorPrices);
        
        // Update chart progressively
        if (sectorData[sector.symbol] && sectorData[sector.symbol].trail.length > 0) {
            successCount++;
            drawChart();
            updateTable();
        }
        
        // Small delay to be nice to Yahoo's servers
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Successfully loaded ${successCount}/${sectors.length} sectors`);
}

function processSectorData(symbol, sectorPrices) {
    try {
        if (!sectorPrices || sectorPrices.length === 0) {
            console.warn(`No price data for ${symbol}`);
            return;
        }
        
        // Use weekly or daily based on setting
        const prices = dataMode === 'weekly' ? convertToWeeklyCloses(sectorPrices) : sectorPrices;
        const benchmarkPrices = dataMode === 'weekly' ? convertToWeeklyCloses(benchmarkData) : benchmarkData;
        
        if (!benchmarkPrices || benchmarkPrices.length === 0) {
            console.warn(`No benchmark data available`);
            return;
        }
        
        const priceRelatives = calculatePriceRelative(prices, benchmarkPrices);
        
        if (priceRelatives.length < 14) {
            console.warn(`Insufficient data for ${symbol}: only ${priceRelatives.length} points`);
            return;
        }
        
        const rsRatios = calculateRSRatio(priceRelatives, 14);
        const rsMomentumValues = calculateRSMomentum(rsRatios, 10);
        
        if (rsMomentumValues.length === 0) {
            console.warn(`Could not calculate momentum for ${symbol}`);
            return;
        }
        
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
        while (trailPoints.length < trailLength && trailPoints.length > 0) {
            trailPoints.unshift({
                rsRatio: trailPoints[0].rsRatio,
                rsMomentum: trailPoints[0].rsMomentum
            });
        }
        
        if (trailPoints.length === 0) {
            console.warn(`No trail points generated for ${symbol}`);
            return;
        }
        
        const sector = sectors.find(s => s.symbol === symbol);
        sectorData[symbol] = {
            ...sector,
            trail: trailPoints,
            rsRatio: trailPoints[trailPoints.length - 1].rsRatio,
            rsMomentum: trailPoints[trailPoints.length - 1].rsMomentum
        };
        
        console.log(`✓ Processed ${symbol}: RS-Ratio=${sectorData[symbol].rsRatio.toFixed(2)}, RS-Momentum=${sectorData[symbol].rsMomentum.toFixed(2)}`);
        
    } catch (error) {
        console.error(`Error processing ${symbol}:`, error);
    }
}

async function processAllSectorData() {
    for (const sector of sectors) {
        const cached = localStorage.getItem(`rrg_${sector.symbol}`);
        if (cached) {
            const sectorPrices = JSON.parse(cached);
            processSectorData(sector.symbol, sectorPrices);
        }
    }
}

function calculatePriceRelative(sectorPrices, benchmarkPrices) {
    const relatives = [];
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

function calculateRSRatio(priceRelatives, period = 14) {
    if (priceRelatives.length < period) return [];
    const rsRatios = [];
    for (let i = period - 1; i < priceRelatives.length; i++) {
        const subset = priceRelatives.slice(Math.max(0, i - period + 1), i + 1);
        const sma = subset.reduce((sum, pr) => sum + pr.value, 0) / subset.length;
        const current = priceRelatives[i].value;
        const rsRatio = (current / sma) * 100;
        rsRatios.push({ date: priceRelatives[i].date, value: rsRatio });
    }
    return rsRatios;
}

function calculateRSMomentum(rsRatios, period = 14) {
    if (rsRatios.length < period) return [];
    const rsMomentum = [];
    for (let i = period; i < rsRatios.length; i++) {
        const current = rsRatios[i].value;
        const past = rsRatios[i - period].value;
        const momentum = ((current - past) / past) * 100 + 100;
        rsMomentum.push({ date: rsRatios[i].date, value: momentum });
    }
    return rsMomentum;
}

function showLoadingMessage(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingMessage';
    loadingDiv.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(102, 126, 234, 0.95); color: white; padding: 20px 40px;
        border-radius: 10px; font-size: 1.1rem; font-weight: 600; z-index: 1000;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    loadingDiv.textContent = message;
    const existing = document.getElementById('loadingMessage');
    if (existing) existing.remove();
    document.body.appendChild(loadingDiv);
    
    // Show placeholder in chart area
    const placeholder = document.getElementById('chartPlaceholder');
    const canvas = document.getElementById('rrgChart');
    if (placeholder && canvas) {
        placeholder.style.display = 'block';
        canvas.style.display = 'none';
    }
}

function hideLoadingMessage() {
    const existing = document.getElementById('loadingMessage');
    if (existing) existing.remove();
    
    // Hide placeholder, show chart
    const placeholder = document.getElementById('chartPlaceholder');
    const canvas = document.getElementById('rrgChart');
    if (placeholder && canvas) {
        placeholder.style.display = 'none';
        canvas.style.display = 'block';
    }
}

function showTemporaryMessage(message, duration) {
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `
        position: fixed; top: 100px; left: 50%; transform: translateX(-50%);
        background: rgba(16, 185, 129, 0.95); color: white; padding: 15px 30px;
        border-radius: 8px; font-size: 1rem; font-weight: 600; z-index: 1001;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    msgDiv.textContent = message;
    document.body.appendChild(msgDiv);
    setTimeout(() => msgDiv.remove(), duration);
}

function updateLastUpdateTime(mode = 'live') {
    lastUpdateTime = new Date();
    const timeString = lastUpdateTime.toLocaleString();
    const periodText = dataMode === 'weekly' ? 'Weekly Closes' : 'Daily Closes';
    
    let existingTime = document.getElementById('lastUpdate');
    if (!existingTime) {
        const footer = document.querySelector('footer');
        existingTime = document.createElement('p');
        existingTime.id = 'lastUpdate';
        existingTime.style.fontWeight = '600';
        existingTime.style.color = '#667eea';
        footer.insertBefore(existingTime, footer.firstChild);
    }
    existingTime.textContent = `📊 Live Market Data | ${periodText} | Updated: ${timeString}`;
}

function getQuadrant(rsRatio, rsMomentum) {
    if (rsRatio >= 100 && rsMomentum >= 100) return 'leading';
    if (rsRatio >= 100 && rsMomentum < 100) return 'weakening';
    if (rsRatio < 100 && rsMomentum < 100) return 'lagging';
    if (rsRatio < 100 && rsMomentum >= 100) return 'improving';
}

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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 4;
    
    drawQuadrants(centerX, centerY);
    drawGrid(centerX, centerY, scale);
    drawAxes(centerX, centerY);
    
    sectors.forEach(sector => {
        const data = sectorData[sector.symbol];
        if (data) drawSectorTrail(data, centerX, centerY, scale);
    });
    
    sectors.forEach(sector => {
        const data = sectorData[sector.symbol];
        if (data) drawSectorPoint(data, centerX, centerY, scale);
    });
}

function drawQuadrants(centerX, centerY) {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.fillRect(centerX, 0, centerX, centerY);
    
    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    ctx.fillRect(centerX, centerY, centerX, centerY);
    
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.fillRect(0, centerY, centerX, centerY);
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(0, 0, centerX, centerY);
    
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
    
    for (let i = -25; i <= 25; i += 5) {
        const x = centerX + (i * scale);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let i = -25; i <= 25; i += 5) {
        const y = centerY - (i * scale);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawAxes(centerX, centerY) {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#374151';
    
    ctx.fillText('RS-Ratio →', canvas.width - 100, centerY - 10);
    ctx.fillText('100', centerX + 5, centerY - 10);
    
    ctx.save();
    ctx.translate(centerX + 15, 60);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('RS-Momentum →', 0, 0);
    ctx.restore();
    ctx.fillText('100', centerX + 5, centerY + 15);
    
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
    
    const distanceFromCenter = Math.sqrt(
        Math.pow(data.rsRatio - 100, 2) + Math.pow(data.rsMomentum - 100, 2)
    );
    const lineWidth = Math.max(1, Math.min(6, distanceFromCenter / 5));
    
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
    
    ctx.fillStyle = color;
    trail.forEach((point) => {
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
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    ctx.fillText(data.symbol, x, y - 15);
}

// Update the table
function updateTable() {
    const tbody = document.getElementById('sectorsTableBody');
    tbody.innerHTML = '';
    
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
