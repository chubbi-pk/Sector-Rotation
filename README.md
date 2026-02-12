# 📊 Sector Rotation Dashboard (RRG Chart)

An interactive Relative Rotation Graph (RRG) dashboard for tracking sector rotation across 11 major sector ETFs using **real-time market data** from Alpha Vantage.

## 🎯 Features

- **Real-time RRG Chart**: Visual representation of sector rotation with live market data
- **Interactive Controls**: Adjust trail length and time periods
- **Sector Analysis Table**: Detailed metrics for each sector
- **Color-Coded Quadrants**:
  - 🟢 **Leading**: Strong RS & Momentum
  - 🟡 **Weakening**: Strong RS, Weak Momentum
  - 🔴 **Lagging**: Weak RS & Momentum
  - 🔵 **Improving**: Weak RS, Strong Momentum
- **Auto-refresh**: Updates every 5 minutes during market hours
- **Live Data**: Powered by Alpha Vantage API

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

## 💻 Local Development

1. Download all files to a folder
2. Open `index.html` in your web browser
3. The dashboard will automatically fetch live market data

## 🔑 API Key

This dashboard uses Alpha Vantage API for real-time market data. Your API key is already configured in the code.

**Important Notes:**
- Free tier allows 5 API calls per minute
- Initial load takes 2-3 minutes (fetching data for all 11 sectors + benchmark)
- Dashboard auto-refreshes every 5 minutes during market hours

## ⏰ Market Hours

The dashboard automatically detects market hours:
- **Active updates**: Monday-Friday, 9:30 AM - 4:00 PM EST
- **Outside market hours**: Data remains cached from last update

## 🔧 How It Works

1. **RS-Ratio**: Measures the trend in relative performance (sector vs SPY)
   - Above 100 = Outperforming benchmark
   - Below 100 = Underperforming benchmark

2. **RS-Momentum**: Measures the rate of change in RS-Ratio
   - Above 100 = Momentum improving
   - Below 100 = Momentum weakening

3. **Rotation**: Sectors typically move clockwise through quadrants:
   - Leading → Weakening → Lagging → Improving → Leading

## 🎨 Customization

- **Change colors**: Edit `styles.css`
- **Modify sectors**: Edit the `sectors` array in `script.js`
- **Adjust calculations**: Modify the RRG calculation functions in `script.js`
- **Change API key**: Update `ALPHA_VANTAGE_API_KEY` in `script.js`

## 📄 License

Free to use and modify for personal or commercial projects.

## 🤝 Contributing

Feel free to fork this project and submit pull requests with improvements!
