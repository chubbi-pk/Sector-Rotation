# 📊 DAILY/WEEKLY CLOSE MODE - SUMMARY

## ✅ What Changed

Your dashboard now works with **closing prices only** - no intraday "live" data.

---

## 🎯 How It Works Now

### **Two Modes Available:**

1. **📅 Daily Close Mode**
   - Uses each day's closing price (4 PM ET)
   - One data point per trading day (Monday-Friday)
   - Trail shows last 12 daily closes
   - More granular rotation tracking

2. **📆 Weekly Close Mode** (Default)
   - Uses each Friday's closing price
   - One data point per week
   - Trail shows last 12 weekly closes
   - Smoother, longer-term rotation view

### **Switch Between Modes:**
- Use the "Period" dropdown at the top
- Select "Daily Close" or "Weekly Close"
- Chart updates instantly using cached data

---

## 🔄 Auto-Update Behavior

### **When Dashboard Fetches New Data:**

✅ **First time you open the page** → Fetches all data (takes 2-3 minutes)

✅ **Once per day after market close** (after 4 PM ET) → Fetches new data automatically

✅ **Manual refresh** → Click "🔄 Refresh Data" button anytime

❌ **NOT continuously** → No real-time updates, only closing prices

### **How Auto-Fetch Works:**

```
1. You open the dashboard
2. Dashboard checks: "Did I fetch data today?"
3. If NO → Shows demo data, then fetches real data in background
4. If YES → Shows cached data from earlier today
5. After 4 PM ET → Will fetch fresh data on next visit
```

---

## 💾 Smart Caching

### **Data is Stored in Your Browser:**

- All fetched price data is saved locally
- Switching between Daily/Weekly uses cached data (instant)
- No API calls needed when recalculating
- Data refreshes once per day after market close

### **Benefits:**

- ✅ Faster performance
- ✅ Fewer API calls (stays within free tier limits)
- ✅ Works offline after initial load
- ✅ Instant mode switching

---

## 📈 What Each Trail Dot Represents

### **Daily Close Mode:**
- Each dot = One day's closing price
- 12 dots = Last 12 trading days (~2.5 weeks)
- Updates once per day after close

### **Weekly Close Mode:**
- Each dot = One Friday's closing price
- 12 dots = Last 12 weeks (~3 months)
- Updates once per week

---

## 🕐 Typical Usage Pattern

### **Monday Morning:**
Dashboard shows Friday's closing data
- No new data until after 4 PM ET Monday

### **Monday Evening (after 4 PM):**
Dashboard fetches Monday's closing prices
- Chart updates with Monday's close
- New dot added to each sector's trail

### **Weekend:**
Dashboard shows Friday's closing data
- No trading, so no new data to fetch

---

## 🔧 Technical Details

### **Data Flow:**

```
1. Fetch closing prices from Alpha Vantage
2. Store in browser localStorage
3. Calculate Price Relative (Sector ÷ SPY)
4. Calculate RS-Ratio (14-period average)
5. Calculate RS-Momentum (10-period rate of change)
6. Plot on RRG chart
```

### **API Efficiency:**

- **First load:** 12 API calls (11 sectors + SPY) = ~2-3 minutes
- **Daily updates:** 12 API calls per day maximum
- **Free tier limit:** 500 calls/day (easily sufficient)
- **Mode switching:** 0 API calls (uses cached data)

---

## 📊 Example Timeline

### **Week 1:**

**Monday 4:30 PM:**
- Dashboard fetches all daily closes
- Chart shows current positions
- Status: "Live Market Data | Daily Closes"

**Tuesday 10 AM:**
- Open dashboard
- Sees Monday's close (from cache)
- Status: "Cached Data | Daily Closes"

**Tuesday 5 PM:**
- Dashboard auto-fetches Tuesday's close
- Chart updates with new positions
- Status: "Live Market Data | Daily Closes"

**Switch to Weekly:**
- Click "Weekly Close" in dropdown
- Chart recalculates using Friday closes
- Status: "Cached Data | Weekly Closes"
- No API calls needed!

---

## 🎯 Key Differences from Previous Version

| Old Version | New Version |
|-------------|-------------|
| Continuous live updates | Once-per-day closes only |
| Updated every 5 minutes | Updates after market close |
| Intraday price changes | End-of-day prices only |
| High API usage | Minimal API usage |
| Demo data fallback | Auto-fetches real data |

---

## 💡 Best Practices

### **For Daily Close Mode:**
- Best for short-term rotation tracking
- See daily momentum shifts
- More responsive to market changes
- Good for traders

### **For Weekly Close Mode:**
- Best for longer-term trends
- Reduces noise from daily volatility
- Clearer rotation patterns
- Good for investors

### **For API Management:**
- Let auto-fetch handle updates
- Only manual refresh if urgent
- Daily mode uses same API calls as weekly
- Both modes work with same cached data

---

## 🔍 What You'll See

### **Status Messages:**

**📊 Live Market Data | Daily Closes | Updated: [timestamp]**
- Fetched fresh data today
- Using daily closing prices
- Shows exact fetch time

**📊 Cached Data | Weekly Closes | Updated: [timestamp]**
- Using previously fetched data
- Showing weekly closes
- Still accurate, just not re-fetched today

**📊 Demo Data | Weekly Closes | Updated: [timestamp]**
- No real data fetched yet
- Using simulated rotation
- Will auto-fetch soon

---

## ⚙️ Configuration Options

You can modify these in `script.js`:

```javascript
// Line 2: Your API key
const ALPHA_VANTAGE_API_KEY = 'DRZQJ20ESGYOO5XP';

// Line 28: Default mode (daily or weekly)
let dataMode = 'weekly';

// Line 22: Number of periods to show
let trailLength = 12;
```

---

## 🆘 Troubleshooting

### **"Data not updating"**
- Check if it's after 4 PM ET
- Click "Refresh Data" manually
- Check browser console for errors

### **"Using Demo Data"**
- First load takes 2-3 minutes
- Let it finish loading
- Or click "Refresh Data"

### **"API rate limit"**
- Wait a few minutes
- Free tier resets every minute
- Dashboard will retry automatically

---

## ✨ Summary

Your dashboard now:
- ✅ Uses closing prices (daily or weekly)
- ✅ Auto-updates once per day after close
- ✅ Caches data for instant mode switching
- ✅ Minimizes API calls
- ✅ Shows current market rotation
- ✅ Works great for both trading and investing

**Perfect for tracking sector rotation without needing real-time data!** 📈
