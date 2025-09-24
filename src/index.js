#!/usr/bin/env node

import BinanceAPI from './data/binanceApi.js';
import DateUtils from './utils/dateUtils.js';
import MathUtils from './utils/mathUtils.js';
import BacktestEngine from './backtest/engine.js';

class BacktestingApp {
    constructor() {
        this.binanceAPI = new BinanceAPI();
        this.config = this.parseArguments();
        this.backtestEngine = new BacktestEngine(
            this.config.capital, 
            this.config.leverage, 
            this.config.maxHours,
            this.config.stopLossPercent,
            this.config.takeProfitPercent,
            this.config.outputDir
        );
    }

    /**
     * Parses command line arguments
     * @returns {Object} Backtesting configuration
     */
    parseArguments() {
        const args = process.argv.slice(2);
        
        const config = {
            symbol: process.env.DEFAULT_SYMBOL || 'BTCUSDT',
            capital: 100,
            leverage: 5,
            maxHours: 4,
            stopLossPercent: 10,
            takeProfitPercent: 20,
            outputDir: './results',
            saveResults: true
        };

        // Parse arguments
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            
            if (arg === '--help' || arg === '-h') {
                this.showHelp();
                process.exit(0);
            } else if (arg.startsWith('--capital=')) {
                config.capital = parseFloat(arg.split('=')[1]);
            } else if (arg.startsWith('--leverage=')) {
                config.leverage = parseFloat(arg.split('=')[1]);
            } else if (arg.startsWith('--hours=')) {
                config.maxHours = parseFloat(arg.split('=')[1]);
            } else if (arg.startsWith('--sl=')) {
                config.stopLossPercent = parseFloat(arg.split('=')[1]);
            } else if (arg.startsWith('--tp=')) {
                config.takeProfitPercent = parseFloat(arg.split('=')[1]);
            } else if (arg.startsWith('--output=')) {
                config.outputDir = arg.split('=')[1];
            } else if (arg === '--no-save') {
                config.saveResults = false;
            } else if (!arg.startsWith('--')) {
                // If it's not an option, it's the symbol
                config.symbol = arg.toUpperCase();
            }
        }

        return config;
    }

    /**
     * Shows program help
     */
    showHelp() {
        console.log('🚀 Trading Strategy Backtesting');
        console.log('=' .repeat(50));
        console.log('');
        console.log('Usage:');
        console.log('  node src/index.js [SYMBOL] [OPTIONS]');
        console.log('');
        console.log('Arguments:');
        console.log('  SYMBOL              Trading pair symbol (e.g: BTCUSDT)');
        console.log('');
        console.log('Options:');
        console.log('  --capital=N         Initial capital in USD (default: 100)');
        console.log('  --leverage=N        Leverage (default: 5)');
        console.log('  --hours=N           Maximum hours per trade (default: 4)');
        console.log('  --sl=N              Stop Loss % of capital (default: 10)');
        console.log('  --tp=N              Take Profit % of capital (default: 20)');
        console.log('  --output=DIR        Output directory for results (default: ./results)');
        console.log('  --no-save           Disable saving results to JSON');
        console.log('  --help, -h          Show this help');
        console.log('');
        console.log('Examples:');
        console.log('  node src/index.js BTCUSDT');
        console.log('  node src/index.js ETHUSDT --capital=200 --leverage=3');
        console.log('  node src/index.js BTCUSDT --hours=2');
        console.log('  node src/index.js BTCUSDT --sl=5 --tp=15');
        console.log('  node src/index.js BTCUSDT --capital=500 --leverage=10 --hours=6 --sl=15 --tp=30');
        console.log('  node src/index.js BTCUSDT --output=./my-results');
        console.log('  node src/index.js BTCUSDT --no-save');
    }

    /**
     * Main program function
     */
    async main() {
        try {
            console.log('🚀 Starting Trading Strategy Backtesting');
            console.log('=' .repeat(50));

            // Show configuration
            console.log(`📊 Symbol: ${this.config.symbol}`);
            console.log(`💵 Initial capital: $${this.config.capital}`);
            console.log(`⚖️  Leverage: ${this.config.leverage}x`);
            console.log(`⏰ Time closure: ${this.config.maxHours} hours`);
            console.log(`🛑 Stop Loss: ${this.config.stopLossPercent}% of capital`);
            console.log(`🎯 Take Profit: ${this.config.takeProfitPercent}% of capital`);
            console.log(`📅 Fetching data from the last 30 days...`);

            // Validate symbol
            this.binanceAPI.validateSymbol(this.config.symbol);

            // Get data from Binance
            const candles = await this.binanceAPI.fetchKlines(this.config.symbol, '1h', 720); // 30 días * 24 horas
            
            console.log(`✅ Data obtained: ${candles.length} candles`);
            console.log(`📅 Date range:`);
            console.log(`   Start: ${DateUtils.formatDate(candles[0].openTime)}`);
            console.log(`   End: ${DateUtils.formatDate(candles[candles.length - 1].openTime)}`);

            // Show basic statistics
            this.showBasicStats(candles);

            // Run backtesting with strategy
            const backtestResults = await this.backtestEngine.runBacktest(candles, this.config.symbol, this.config, this.config.saveResults);

            console.log('\n🎯 Backtesting completed successfully!');

        } catch (error) {
            console.error('❌ Application error:', error.message);
            process.exit(1);
        }
    }

    /**
     * Shows basic statistics of the obtained data
     * @param {Array} candles - Array of candles
     */
    showBasicStats(candles) {
        const prices = candles.map(c => c.close);
        const highPrices = candles.map(c => c.high);
        const lowPrices = candles.map(c => c.low);
        
        const maxPrice = MathUtils.max(highPrices);
        const minPrice = MathUtils.min(lowPrices);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        
        console.log('\n📈 Price Statistics:');
        console.log(`   Maximum price: $${MathUtils.round(maxPrice, 2)}`);
        console.log(`   Minimum price: $${MathUtils.round(minPrice, 2)}`);
        console.log(`   Average price: $${MathUtils.round(avgPrice, 2)}`);
        console.log(`   Range: $${MathUtils.round(maxPrice - minPrice, 2)}`);
        
        // Group by day to show unique days
        const dailyCandles = DateUtils.groupCandlesByDay(candles);
        const uniqueDays = Object.keys(dailyCandles).length;
        console.log(`   Unique days: ${uniqueDays}`);
    }
}

// Run the application
const app = new BacktestingApp();
app.main().catch(console.error);

export default BacktestingApp;
