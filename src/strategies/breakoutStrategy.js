import DateUtils from '../utils/dateUtils.js';
import MathUtils from '../utils/mathUtils.js';

class BreakoutStrategy {
    constructor() {
        this.dailyLevels = {};
    }

    /**
     * Calculates daily levels (high/low) from the previous day for each day
     * @param {Array} candles - Array of candles ordered by time
     * @returns {Object} Object with levels per day
     */
    calculateDailyLevels(candles) {
        console.log('📊 Calculating daily levels...');
        
        // Group candles by day
        const dailyCandles = DateUtils.groupCandlesByDay(candles);
        const dates = Object.keys(dailyCandles).sort();
        
        this.dailyLevels = {};
        
        // For each day, calculate high/low from the previous day
        for (let i = 0; i < dates.length; i++) {
            const currentDate = dates[i];
            const currentDayCandles = dailyCandles[currentDate];
            
            // Calculate high/low of the current day
            const currentHigh = MathUtils.max(currentDayCandles.map(c => c.high));
            const currentLow = MathUtils.min(currentDayCandles.map(c => c.low));
            
            // Get high/low from the previous day (if exists)
            let previousHigh = null;
            let previousLow = null;
            
            if (i > 0) {
                const previousDate = dates[i - 1];
                const previousDayCandles = dailyCandles[previousDate];
                previousHigh = MathUtils.max(previousDayCandles.map(c => c.high));
                previousLow = MathUtils.min(previousDayCandles.map(c => c.low));
            }
            
            this.dailyLevels[currentDate] = {
                currentHigh,
                currentLow,
                previousHigh,
                previousLow,
                candles: currentDayCandles
            };
        }
        
        console.log(`✅ Levels calculated for ${dates.length} days`);
        return this.dailyLevels;
    }

    /**
     * Detects if a candle breaks the levels from the previous day
     * @param {Object} candle - Current candle
     * @param {number} dailyHigh - High from the previous day
     * @param {number} dailyLow - Low from the previous day
     * @returns {Object|null} Breakout information or null if no breakout
     */
    detectBreakout(candle, dailyHigh, dailyLow) {
        if (!dailyHigh || !dailyLow) {
            return null; // No previous day
        }

        const breakout = {
            type: null,
            direction: null,
            reason: null,
            entryPrice: candle.close
        };

        // Check high breakout
        if (candle.high > dailyHigh) {
            breakout.type = 'BREAKOUT_HIGH';
            
            // Check if the entire body is above the high
            if (candle.open > dailyHigh && candle.close > dailyHigh) {
                breakout.direction = 'LONG';
                breakout.reason = 'Body above previous high';
                breakout.entryPrice = candle.close;
            }
            // Check if the body is below but the wick touches above
            else if (candle.open < dailyHigh && candle.close < dailyHigh) {
                breakout.direction = 'SHORT';
                breakout.reason = 'Body below previous high, wick touched above';
                breakout.entryPrice = candle.close;
            }
            
            return breakout;
        }

        // Check low breakout
        if (candle.low < dailyLow) {
            breakout.type = 'BREAKOUT_LOW';
            
            // Check if the entire body is below the low
            if (candle.open < dailyLow && candle.close < dailyLow) {
                breakout.direction = 'SHORT';
                breakout.reason = 'Body below previous low';
                breakout.entryPrice = candle.close;
            }
            // Check if the body is above but the wick touches below
            else if (candle.open > dailyLow && candle.close > dailyLow) {
                breakout.direction = 'LONG';
                breakout.reason = 'Body above previous low, wick touched below';
                breakout.entryPrice = candle.close;
            }
            
            return breakout;
        }

        return null; // No breakout
    }

    /**
     * Determines the trade direction based on the breakout type
     * @param {string} breakoutType - Breakout type (BREAKOUT_HIGH/BREAKOUT_LOW)
     * @param {Object} candle - Candle that generated the breakout
     * @param {number} dailyHigh - High from the previous day
     * @param {number} dailyLow - Low from the previous day
     * @returns {Object|null} Trade information or null
     */
    determineTradeDirection(breakoutType, candle, dailyHigh, dailyLow) {
        const breakout = this.detectBreakout(candle, dailyHigh, dailyLow);
        return breakout;
    }

    /**
     * Checks if a trade should be opened based on conditions
     * @param {Object} candle - Current candle
     * @param {string} currentDate - Current date
     * @param {Array} todayTrades - Trades from the current day
     * @returns {Object|null} Trading signal or null
     */
    shouldOpenTrade(candle, currentDate, todayTrades = []) {
        // Check if there is already a trade today
        if (todayTrades.length > 0) {
            return null; // Already have a trade today
        }

        // Get levels from the previous day
        const dayData = this.dailyLevels[currentDate];
        if (!dayData || !dayData.previousHigh || !dayData.previousLow) {
            return null; // No previous day
        }

        // Detect breakout
        const breakout = this.detectBreakout(candle, dayData.previousHigh, dayData.previousLow);
        
        if (breakout && breakout.direction) {
            return {
                date: currentDate,
                time: DateUtils.formatDate(candle.openTime),
                type: breakout.type,
                direction: breakout.direction,
                entryPrice: breakout.entryPrice,
                dailyHigh: dayData.previousHigh,
                dailyLow: dayData.previousLow,
                reason: breakout.reason,
                candle: candle
            };
        }

        return null;
    }

    /**
     * Processes all candles and detects trading signals
     * @param {Array} candles - Array of candles
     * @returns {Array} Array of detected signals
     */
    processCandles(candles) {
        console.log('🔍 Processing candles to detect signals...');
        
        // Calculate daily levels
        this.calculateDailyLevels(candles);
        
        const signals = [];
        const dailyTrades = {}; // To control 1 trade per day
        
        // Process each candle
        for (const candle of candles) {
            const currentDate = DateUtils.getDateOnly(candle.openTime);
            
            // Check if there is already a trade today
            if (dailyTrades[currentDate]) {
                continue; // Already have a trade today
            }
            
            // Check if trade should be opened
            const signal = this.shouldOpenTrade(candle, currentDate, dailyTrades[currentDate] ? [dailyTrades[currentDate]] : []);
            
            if (signal) {
                signals.push(signal);
                dailyTrades[currentDate] = signal; // Mark that there is already a trade today
            }
        }
        
        console.log(`✅ ${signals.length} signals detected in total`);
        return signals;
    }

    /**
     * Gets statistics of detected signals
     * @param {Array} signals - Array of signals
     * @returns {Object} Statistics
     */
    getSignalsStats(signals) {
        const stats = {
            total: signals.length,
            long: signals.filter(s => s.direction === 'LONG').length,
            short: signals.filter(s => s.direction === 'SHORT').length,
            breakoutHigh: signals.filter(s => s.type === 'BREAKOUT_HIGH').length,
            breakoutLow: signals.filter(s => s.type === 'BREAKOUT_LOW').length,
            byReason: {}
        };

        // Group by reason
        signals.forEach(signal => {
            if (!stats.byReason[signal.reason]) {
                stats.byReason[signal.reason] = 0;
            }
            stats.byReason[signal.reason]++;
        });

        return stats;
    }
}

export default BreakoutStrategy;
