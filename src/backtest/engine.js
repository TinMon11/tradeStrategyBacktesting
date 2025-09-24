import BreakoutStrategy from '../strategies/breakoutStrategy.js';
import TradeSimulator from './tradeSimulator.js';
import DateUtils from '../utils/dateUtils.js';
import ResultsExporter from '../output/resultsExporter.js';

class BacktestEngine {
    constructor(initialCapital = 100, leverage = 5, maxHours = 4, stopLossPercent = 10, takeProfitPercent = 20, outputDir = './results') {
        this.strategy = new BreakoutStrategy();
        this.simulator = new TradeSimulator(initialCapital, leverage, maxHours, stopLossPercent, takeProfitPercent);
        this.exporter = new ResultsExporter(outputDir);
        this.signals = [];
        this.trades = [];
    }

    /**
     * Executes backtesting with the provided data
     * @param {Array} candles - Array of candles
     * @param {string} symbol - Trading pair symbol
     * @param {Object} config - Backtesting configuration
     * @param {boolean} saveResults - Whether to save results to JSON
     * @returns {Object} Backtesting results
     */
    async runBacktest(candles, symbol, config = {}, saveResults = true) {
        console.log(`🚀 Starting backtesting for ${symbol}`);
        console.log(`📊 Processing ${candles.length} candles...`);

        // Process candles with strategy (without detailed logs)
        this.signals = this.strategy.processCandles(candles);

        // Simulate trades with unified logs
        console.log('\n🔄 Simulating trades...');
        this.simulateAllTradesWithLogs(candles);

        // Show final statistics
        this.showFinalStats();

        // Prepare data for export
        const backtestData = {
            symbol,
            totalCandles: candles.length,
            signals: this.signals,
            trades: this.trades,
            stats: this.strategy.getSignalsStats(this.signals),
            tradingStats: this.simulator.getTradingStats(),
            dailyResults: this.simulator.getDailyResults()
        };

        // Export results if enabled
        if (saveResults) {
            try {
                const filepath = await this.exporter.exportToJSON(backtestData, symbol, candles, config);
                console.log(`📄 Results saved to: ${filepath}`);
            } catch (error) {
                console.error('⚠️  Failed to save results:', error.message);
            }
        }

        return backtestData;
    }

    /**
     * Simulates all trades with unified logs (signal + result)
     * @param {Array} candles - Array of candles
     */
    simulateAllTradesWithLogs(candles) {
        this.trades = [];
        
        // Group signals by day
        const signalsByDay = this.groupSignalsByDay();
        const allDays = this.getAllDays(candles);
        
        // Process each day
        for (const day of allDays) {
            const daySignals = signalsByDay[day] || [];
            
            if (daySignals.length > 0) {
                // Show day date
                console.log(`\n📅 ${this.formatDate(day)}:`);
                
                // Process each signal of the day
                for (const signal of daySignals) {
                    const entryCandleIndex = candles.findIndex(c => 
                        c.openTime === signal.candle.openTime
                    );
                    
                    if (entryCandleIndex === -1) continue;
                    
                    const remainingCandles = candles.slice(entryCandleIndex + 1);
                    this.showSignalAndTrade(signal, remainingCandles);
                }
            } else {
                // Day without signals
                console.log(`\n📅 ${this.formatDate(day)}: (No signal detected)`);
            }
        }
        
        console.log(`\n✅ ${this.trades.length} trades simulated`);
    }

    /**
     * Shows the signal and simulates the trade in a single log
     * @param {Object} signal - Trading signal
     * @param {Array} remainingCandles - Remaining candles
     */
    showSignalAndTrade(signal, remainingCandles) {
        // Show signal
        const levelPrice = signal.type === 'BREAKOUT_HIGH' ? signal.dailyHigh : signal.dailyLow;
        console.log(`🎯 ${signal.direction} at $${signal.entryPrice.toFixed(4)} - ${signal.reason} (Level: $${levelPrice.toFixed(4)})`);
        
        // Simulate trade (without internal logs)
        const trade = this.simulator.simulateTradeSilent(signal, remainingCandles);
        this.trades.push(trade);
        
        // Show result
        const resultIcon = trade.resultUSD > 0 ? '✅' : '❌';
        console.log(`   ${resultIcon} ${trade.exitReason} at $${trade.exitPrice.toFixed(4)} (${trade.durationHours}h) → $${trade.resultUSD.toFixed(2)} (${trade.resultPercent}%)`);
    }

    /**
     * Groups signals by day
     * @returns {Object} Signals grouped by day
     */
    groupSignalsByDay() {
        const signalsByDay = {};
        
        this.signals.forEach(signal => {
            if (!signalsByDay[signal.date]) {
                signalsByDay[signal.date] = [];
            }
            signalsByDay[signal.date].push(signal);
        });
        
        return signalsByDay;
    }

    /**
     * Gets all days from the backtesting period
     * @param {Array} candles - Array of candles
     * @returns {Array} Array of sorted days
     */
    getAllDays(candles) {
        const days = new Set();
        
        candles.forEach(candle => {
            const day = DateUtils.getDateOnly(candle.openTime);
            days.add(day);
        });
        
        return Array.from(days).sort();
    }

    /**
     * Formats a date for display
     * @param {string} dateString - Date in YYYY-MM-DD format
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    /**
     * Shows unified final statistics
     */
    showFinalStats() {
        const signalStats = this.strategy.getSignalsStats(this.signals);
        const tradingStats = this.simulator.getTradingStats();
        
        console.log('\n📊 Final Statistics:');
        console.log('=' .repeat(60));
        
        // Signal statistics
        console.log(`🎯 Total signals: ${signalStats.total}`);
        console.log(`   LONG: ${signalStats.long} (${Math.round(signalStats.long / signalStats.total * 100)}%)`);
        console.log(`   SHORT: ${signalStats.short} (${Math.round(signalStats.short / signalStats.total * 100)}%)`);
        
        // Trading statistics
        console.log(`💰 Trading Results:`);
        console.log(`   Total trades: ${tradingStats.totalTrades}`);
        console.log(`   ✅ Winners: ${tradingStats.winningTrades} | ❌ Losers: ${tradingStats.losingTrades}`);
        console.log(`   🎯 Win rate: ${tradingStats.winRate}%`);
        console.log(`   💵 Capital: $${tradingStats.initialCapital} → $${tradingStats.finalBalance}`);
        console.log(`   📈 Total profit: $${tradingStats.totalReturn} (${tradingStats.totalReturnPercent}%)`);
        console.log(`   📊 Avg win: $${tradingStats.avgWin} | Avg loss: $${tradingStats.avgLoss}`);
        console.log(`   ⚖️  Profit factor: ${tradingStats.profitFactor}`);
    }
}

export default BacktestEngine;
