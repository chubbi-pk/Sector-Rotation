# 📊 Sector Rotation Dashboard (RRG Chart)

An interactive Relative Rotation Graph (RRG) dashboard for tracking sector rotation across 11 major sector ETFs using **daily or weekly closing prices** from Alpha Vantage.

## 🎯 Features

- **Daily or Weekly Close Data**: Choose between daily and weekly closing prices
- **Auto-Update**: Fetches new data once per day after market close
- **Interactive RRG Chart**: Visual representation of sector rotation with live market data
- **Adjustable Controls**: Switch between daily/weekly and adjust trail length
- **Sector Analysis Table**: Detailed metrics for each sector
- **Color-Coded Quadrants**:
  - 🟢 **Leading**: Strong RS & Momentum
  - 🟡 **Weakening**: Strong RS, Weak Momentum
  - 🔴 **Lagging**: Weak RS & Momentum
  - 🔵 **Improving**: Weak RS, Strong Momentum
- **Smart Caching**: Stores data locally to minimize API calls

## 📈 Tracked Sectors

- XLK - Technology
- XLU - Utilities
- XLE - Energy
- XLC - Communication
- XLB - Materials
- XLP - Consumer Staples
- XLRE - Real Estate
- XLY - Consumer Discretionary
- XLI - Industrials
- XLV - Healthcare
- XLF - Financials

**Benchmark**: SPY (S&P 500 ETF)

## 🚀 Live Demo

Once published on GitHub Pages, your dashboard will be available at:
`https://YOUR-USERNAME.github.io/rrg-dashboard/`

## 💻 How It Works

### **Data Fetching**
1. **First Visit**: Dashboard loads with demo data, then automatically fetches real market data
2. **Auto-Update**: Checks once per day after market close (4 PM ET)
3. **Manual Refresh**: Click "🔄 Refresh Data" button anytime to update
4. **Smart Caching**: Stores data in browser to avoid unnecessary API calls

### **Period Selection**
- **Daily Close**: Uses each day's closing price (Monday-Friday)
- **Weekly Close**: Uses Friday's closing price for each week
- Switch between modes instantly - data is recalculated on the fly

### **Data Flow**
```
Alpha Vantage API → Daily Prices → Daily/Weekly Selection → 
Price Relative (vs SPY) → RS-Ratio → RS-Momentum → RRG Chart
```

## 🔑 API Configuration

This dashboard uses Alpha Vantage API with your API key already configured.

**Important Notes:**
- Free tier: 5 API calls per minute, 500 calls per day
- Initial load: ~2-3 minutes (fetching 12 symbols: 11 sectors + SPY)
- Data caching: Reduces API usage significantly
- Rate limiting: Dashboard automatically waits 12 seconds between calls

## 📊 How the Calculations Work

### 1. **Price Relative**
```
Price Relative = Sector Price / Benchmark Price (SPY)
```

### 2. **RS-Ratio** (Normalized to 100)
```
RS-Ratio = (Current Price Relative / 14-day Average) × 100
- Above 100 = Outperforming benchmark
- Below 100 = Underperforming benchmark
```

### 3. **RS-Momentum** (Rate of change)
```
RS-Momentum = ((Current RS-Ratio - Past RS-Ratio) / Past RS-Ratio) × 100 + 100
- Above 100 = Momentum improving
- Below 100 = Momentum weakening
```

### 4. **Rotation Pattern**
Sectors typically move clockwise through quadrants:
```
Leading → Weakening → Lagging → Improving → Leading
```

## ⏰ Update Schedule

- **Weekdays after 4 PM ET**: Auto-fetches new data once
- **Weekends**: Uses Friday's closing data
- **Manual**: Click refresh button anytime
- **Cached**: Data stored in browser until next day

## 🎨 Customization

- **Change colors**: Edit `styles.css`
- **Modify sectors**: Edit the `sectors` array in `script.js`
- **Adjust calculations**: Modify period parameters (currently 14 for RS-Ratio, 10 for RS-Momentum)
- **Change API key**: Update `ALPHA_VANTAGE_API_KEY` in `script.js`
- **Adjust fetch schedule**: Modify `checkShouldFetchData()` function

## 📄 License

Free to use and modify for personal or commercial projects.

## 🤝 Contributing

Feel free to fork this project and submit pull requests with improvements!
