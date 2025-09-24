# 🚀 Crypto Trading Strategy Backtesting System

A comprehensive Node.js backtesting framework for validating cryptocurrency trading strategies using real market data from Binance API.

## 📊 Strategy Overview

This system implements and validates a **Daily Breakout Trading Strategy** with the following logic:

### Strategy Rules
- **Data Source**: 1-hour Binance candles for the last 30 days
- **Entry Conditions**:
  - **Long Position**: When a candle breaks the previous day's high AND the entire body is above the high
  - **Short Position**: When a candle breaks the previous day's low AND the entire body is below the low
  - **Alternative Entries**: Body below/above but wick touches the level (opposite direction)
- **Risk Management**:
  - **Initial Capital**: $100 USD (configurable)
  - **Leverage**: 5x (configurable)
  - **Position Size**: $500 USD (capital × leverage)
  - **Stop Loss**: 10% of capital (2% against entry price with 5x leverage)
  - **Take Profit**: 20% of capital (4% in favor of entry price with 5x leverage)
  - **Time Closure**: 4 hours maximum per trade (configurable)
- **Trading Rules**:
  - Only one trade per day (first breakout takes precedence)
  - Trades close on SL/TP or time limit
  - Cumulative balance tracking

## 🛠️ Technologies Used

- **Runtime**: Node.js with ES6 Modules
- **HTTP Client**: Axios for Binance API communication
- **Date Handling**: Moment.js for date manipulation
- **Data Processing**: Custom utility classes for mathematical calculations
- **Export**: JSON file generation for results analysis
- **CLI**: Command-line interface with configurable parameters

## 📁 Project Structure

```
backtestingCryptoTrading/
├── src/
│   ├── data/
│   │   └── binanceApi.js          # Binance API client
│   ├── utils/
│   │   ├── dateUtils.js           # Date manipulation utilities
│   │   └── mathUtils.js           # Mathematical calculations
│   ├── strategies/
│   │   └── breakoutStrategy.js    # Breakout strategy implementation
│   ├── backtest/
│   │   ├── engine.js              # Main backtesting orchestrator
│   │   └── tradeSimulator.js      # Trade simulation logic
│   ├── output/
│   │   ├── dataFormatter.js       # Data formatting for export
│   │   ├── resultsExporter.js     # JSON export functionality
│   │   └── index.js               # Output module exports
│   └── index.js                   # Main application entry point
├── results/                       # Generated backtesting results
├── package.json                   # Dependencies and scripts
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd backtestingCryptoTrading

# Install dependencies
npm install

# Copy environment file (optional)
cp .env.example .env
```

### Basic Usage
```bash
# Run backtesting with default parameters
node src/index.js BTCUSDT

# Run with custom parameters
node src/index.js ETHUSDT --capital=200 --leverage=3 --hours=2

# Run without saving results
node src/index.js BTCUSDT --no-save
```

## ⚙️ Configuration Options

### Command Line Arguments

| Parameter | Description | Default | Example |
|-----------|-------------|---------|---------|
| `SYMBOL` | Trading pair symbol | BTCUSDT | `BTCUSDT`, `ETHUSDT` |
| `--capital=N` | Initial capital in USD | 100 | `--capital=200` |
| `--leverage=N` | Leverage multiplier | 5 | `--leverage=3` |
| `--hours=N` | Max hours per trade | 4 | `--hours=2` |
| `--sl=N` | Stop Loss % of capital | 10 | `--sl=5` |
| `--tp=N` | Take Profit % of capital | 20 | `--tp=15` |
| `--output=DIR` | Output directory | ./results | `--output=./my-results` |
| `--no-save` | Disable JSON export | false | `--no-save` |
| `--help, -h` | Show help | - | `--help` |

### Example Commands

```bash
# Conservative approach
node src/index.js BTCUSDT --capital=100 --leverage=2 --sl=5 --tp=10

# Aggressive approach
node src/index.js ETHUSDT --capital=500 --leverage=10 --hours=6 --sl=15 --tp=30

# Custom output directory
node src/index.js BTCUSDT --output=./backtest-results

# Quick test without saving
node src/index.js BTCUSDT --no-save
```

## 📈 Output and Results

### Console Output
The system provides real-time feedback including:
- Configuration summary
- Data fetching progress
- Daily trade signals and results
- Final statistics and performance metrics

### JSON Export
Results are automatically saved to `results/` directory with the format:
```
{SYMBOL}_{START_DATE}_to_{END_DATE}.json
```

Example: `BTCUSDT_2025-08-24_to_2025-09-23.json`

### JSON Structure
```json
{
  "metadata": {
    "symbol": "BTCUSDT",
    "startDate": "2025-08-24",
    "endDate": "2025-09-23",
    "totalDays": 31,
    "strategy": "breakout",
    "parameters": {
      "initialCapital": 100,
      "leverage": 5,
      "maxHours": 4,
      "stopLossPercent": 10,
      "takeProfitPercent": 20
    }
  },
  "dailyResults": {
    "2025-08-25": {
      "tradeExecuted": true,
      "balanceBefore": 100,
      "balanceAfter": 98.12,
      "dailyReturn": -1.88,
      "trade": {
        "id": "trade_1",
        "direction": "LONG",
        "entryPrice": 113493.59,
        "exitPrice": 113066.94,
        "exitReason": "TIME",
        "resultUSD": -1.88,
        "resultPercent": -1.88
      }
    }
  },
  "summary": {
    "totalTrades": 25,
    "winningTrades": 6,
    "losingTrades": 19,
    "winRate": 24,
    "totalReturn": -12.62,
    "finalBalance": 87.38,
    "profitFactor": 1.2
  }
}
```

## 📊 Performance Metrics

The system calculates comprehensive performance metrics:

- **Total Trades**: Number of executed trades
- **Win Rate**: Percentage of profitable trades
- **Total Return**: Absolute profit/loss in USD
- **Total Return %**: Percentage return on initial capital
- **Average Win/Loss**: Average profit and loss per trade
- **Profit Factor**: Ratio of gross profit to gross loss
- **Maximum Drawdown**: Largest peak-to-trough decline

## 🔧 Technical Features

### Modular Architecture
- **Separation of Concerns**: Each module handles specific functionality
- **ES6 Modules**: Modern JavaScript module system
- **Error Handling**: Comprehensive error management and validation
- **Data Validation**: Input validation and data consistency checks

### API Integration
- **Binance API**: Real-time market data fetching
- **Rate Limiting**: Built-in API rate limit handling
- **Error Recovery**: Robust error handling for network issues

### Financial Calculations
- **Leverage Integration**: Proper leverage calculations for position sizing
- **Risk Management**: Accurate SL/TP calculations based on capital percentage
- **Balance Tracking**: Cumulative balance updates with precision handling

## 🧪 Testing and Validation

### Supported Trading Pairs
- BTCUSDT, ETHUSDT, BNBUSDT, ADAUSDT, XRPUSDT
- SOLUSDT, DOTUSDT, DOGEUSDT, AVAXUSDT, LINKUSDT
- *Any valid Binance trading pair (with warning)*

### Data Validation
- **Candle Data**: Validates OHLCV data integrity
- **Date Consistency**: Ensures chronological data order
- **Balance Consistency**: Validates cumulative balance calculations

## 🚨 Risk Disclaimer

This is a **backtesting system for educational and research purposes only**. 

- Past performance does not guarantee future results
- Backtesting results may not reflect real trading conditions
- Consider transaction costs, slippage, and market impact in live trading
- Always perform additional validation before live trading
- Use proper risk management in real trading scenarios

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup
```bash
# Install dependencies
npm install

# Run with development settings
node src/index.js BTCUSDT --capital=100 --leverage=5
```

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Contact

For questions or suggestions, please open an issue in the repository.

---

**Built with ❤️ for quantitative trading research and education**
