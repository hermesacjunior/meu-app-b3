# Stock Analysis Dashboard - B3

## 📊 Project Overview

A professional-grade stock analysis dashboard for Brazilian B3 stocks with real-time technical analysis, supporting three independent trading strategies: Day Trade, Swing Trade, and Hold.

## 🎯 Key Features

- **Real-time stock analysis** with advanced technical indicators
- **Three independent strategies**: Day Trade (intraday), Swing Trade (3-20 days), Hold (6+ months)
- **15+ technical indicators**: EMA, RSI, MACD, Bollinger Bands, ATR, Volume, ROC
- **Portfolio management** with live P&L tracking
- **Signal confidence scoring** (0-100%)
- **100+ B3 stocks** across multiple sectors
- **Modern, minimalist UI** with dark theme
- **Historical operations tracking**

## 🛠 Technology Stack

- **Frontend**: Streamlit
- **Data**: yfinance (Yahoo Finance API)
- **Analysis**: pandas, numpy
- **Visualization**: Plotly
- **Language**: Python 3.9+

## 📁 Project Structure

```
meu-app-b3/
├── app.py                  # Main Streamlit application
├── README.md              # User documentation with examples
├── requirements.txt       # Python dependencies
├── .streamlit/
│   └── config.toml       # Streamlit configuration
├── CLAUDE.md             # This file
└── .git/                 # Git repository
```

## 🚀 Running the Application

```bash
# Install dependencies
pip install -r requirements.txt

# Run the app
streamlit run app.py

# Access at http://localhost:8501
```

## 📊 Technical Indicators Implemented

All indicators are implemented from scratch using numpy/pandas (no external library dependencies):

### Moving Averages
- EMA (Exponential Moving Average): 9, 21, 50 periods
- SMA (Simple Moving Average): 200 periods

### Momentum Indicators
- RSI (Relative Strength Index): 14 periods
- MACD (Moving Average Convergence Divergence): 12, 26, 9
- ROC (Rate of Change): 10 periods

### Volatility Indicators
- Bollinger Bands: 20 periods, 2 standard deviations
- ATR (Average True Range): 14 periods
- Volume Moving Average: 20 periods

## 🎯 Trading Strategies

### Day Trade (Intraday)
- **Time horizon**: Minutes to hours
- **Entry signals**: EMA crossover, RSI < 70, volume confirmation
- **Exit targets**: 2% profit, 2% stop loss
- **Update interval**: 1-minute candles

### Swing Trade (Medium Term)
- **Time horizon**: 3-20 days
- **Entry signals**: Trend confirmation, RSI oversold (< 40), support testing
- **Exit targets**: 5% profit, 3% stop loss
- **Update interval**: 1-hour candles

### Hold (Long Term)
- **Time horizon**: 6+ months
- **Entry signals**: Long-term trend, fundamental strength, attractive valuation
- **Exit targets**: 15% profit over 12 months
- **Update interval**: 1-day candles

## 💾 Data Persistence

- Portfolio positions stored in Streamlit session state
- Historical operations tracked in memory
- Can be extended with database (SQLite, PostgreSQL)

## 🔄 Analysis Flow

1. User selects a stock (e.g., PETR4.SA)
2. User chooses a strategy (Day Trade, Swing Trade, Hold)
3. App downloads relevant historical data
4. Technical indicators are calculated
5. Strategy-specific analysis produces:
   - Signal (BUY, SELL, or WAIT)
   - Confidence score (0-100%)
   - Entry price recommendation
   - Take Profit level
   - Stop Loss level
   - Detailed explanation of analysis
6. User can execute operation or add to watchlist
7. Portfolio is tracked in real-time

## 🎨 UI/UX Design

- **Dark theme** with modern gradient backgrounds
- **Color scheme**:
  - Primary green (#00ff88) for buy signals
  - Red (#ff3366) for sell signals
  - Orange (#ffaa00) for wait/caution
  - Cyan (#00ccff) for secondary info
- **Responsive layout** with sidebar navigation
- **Real-time charts** using Plotly
- **Card-based design** for clean information hierarchy

## 📚 B3 Stock Coverage

Organized by sectors:
- **Financeiro**: ITUB4.SA, BBDC4.SA, BBAS3.SA, INTER4.SA
- **Commodities**: PETR4.SA, VALE3.SA, GGBR4.SA, CSNA3.SA, USIM5.SA
- **Varejo**: MGLU3.SA, PETZ3.SA, VVAR3.SA, LREN3.SA
- **Infraestrutura**: WEGE3.SA, RENT3.SA, CCRO3.SA, TAEE11.SA, TRPL4.SA
- **Energia**: ENEM6.SA, ENGI11.SA
- **Alimentos**: ABEV3.SA, JBSS3.SA, MARFM3.SA
- And more...

## 🔒 Risk Management

- Position sizing with available balance checking
- Automatic Stop Loss calculation
- Take Profit level recommendation
- P&L tracking per position
- Historical performance metrics

## 📈 Future Enhancements

- [ ] Database integration for persistent storage
- [ ] Email alerts for trading signals
- [ ] Advanced pattern recognition (chart patterns)
- [ ] Backtesting engine
- [ ] Multi-stock scanner
- [ ] API integration for real broker orders
- [ ] Machine learning predictions
- [ ] Options analysis
- [ ] Crypto support

## ⚠️ Important Notes

- **Educational purposes**: This is a learning and analysis tool
- **Paper trading**: No real money is at risk in the current version
- **Data source**: Yahoo Finance via yfinance (may have delays)
- **No guarantee**: Past performance doesn't guarantee future results
- **Always validate**: Use professional financial advice before real trading

## 📝 Development Notes

- All indicators implemented from scratch (no pandas-ta dependency)
- Clean separation of analysis logic from UI
- Extensible strategy system (easy to add new strategies)
- Session state management for user interactions
- Error handling for network/data issues

## 🎓 Learning Resources

- Technical Analysis: Chart patterns, support/resistance, trends
- Indicators: How each indicator works and what it means
- Risk Management: Position sizing, stop loss, profit targets
- Trading Psychology: Discipline, patience, emotional control

## 📞 Support

For issues or questions:
1. Check the README.md for detailed usage instructions
2. Review example analysis in README
3. Verify yfinance data availability
4. Check logs for error messages

---

**Last Updated**: May 21, 2026
**Status**: Production-ready for analysis and paper trading
**Branch**: claude/stock-analysis-dashboard-IsahZ
