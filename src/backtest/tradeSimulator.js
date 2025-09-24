import DateUtils from '../utils/dateUtils.js';
import MathUtils from '../utils/mathUtils.js';

class TradeSimulator {
    constructor(initialCapital = 100, leverage = 5, maxHours = 4, stopLossPercent = 10, takeProfitPercent = 20) {
        this.initialCapital = initialCapital;
        this.leverage = leverage;
        this.maxHours = maxHours;
        this.stopLossPercent = stopLossPercent;
        this.takeProfitPercent = takeProfitPercent;
        this.currentBalance = initialCapital;
        this.trades = [];
        this.dailyResults = {};
    }

    /**
     * Simulates a complete trade from entry to exit
     * @param {Object} signal - Trading signal
     * @param {Array} remainingCandles - Remaining candles to simulate
     * @returns {Object} Simulated trade result
     */
    simulateTrade(signal, remainingCandles) {
        const trade = {
            id: `trade_${this.trades.length + 1}`,
            signal: signal,
            entryPrice: signal.entryPrice,
            entryTime: signal.candle.openTime,
            direction: signal.direction,
            positionSize: this.currentBalance * this.leverage, // $500 with $100 and 5x
            leverage: this.leverage,
            stopLoss: this.calculateStopLoss(signal.entryPrice, signal.direction),
            takeProfit: this.calculateTakeProfit(signal.entryPrice, signal.direction),
            exitPrice: null,
            exitTime: null,
            exitReason: null,
            resultUSD: 0,
            resultPercent: 0,
            durationHours: 0
        };

        console.log(`🔄 Simulating trade ${trade.id}: ${trade.direction} at $${trade.entryPrice}`);
        console.log(`   SL: $${trade.stopLoss} | TP: $${trade.takeProfit}`);

        // Simulate until finding exit
        for (let i = 0; i < remainingCandles.length; i++) {
            const candle = remainingCandles[i];
            const exitCondition = this.checkExitConditions(candle, trade);

            if (exitCondition) {
                trade.exitPrice = exitCondition.price;
                trade.exitTime = candle.openTime;
                trade.exitReason = exitCondition.reason;
                trade.durationHours = DateUtils.getHoursDifference(trade.entryTime, trade.exitTime);
                
                // Calculate result
                const result = this.calculateTradeResult(trade);
                trade.resultUSD = result.usd;
                trade.resultPercent = result.percent;

                console.log(`   ✅ Trade closed: ${trade.exitReason} at $${trade.exitPrice} (${trade.durationHours}h)`);
                console.log(`   💰 Result: $${trade.resultUSD} (${trade.resultPercent}%)`);

                break;
            }
        }

        // If not closed, close at end of day
        if (!trade.exitPrice) {
            const lastCandle = remainingCandles[remainingCandles.length - 1];
            trade.exitPrice = lastCandle.close;
            trade.exitTime = lastCandle.openTime;
            trade.exitReason = 'END_OF_DAY';
            trade.durationHours = DateUtils.getHoursDifference(trade.entryTime, trade.exitTime);
            
            const result = this.calculateTradeResult(trade);
            trade.resultUSD = result.usd;
            trade.resultPercent = result.percent;

            console.log(`   ⏰ Trade closed: ${trade.exitReason} at $${trade.exitPrice} (${trade.durationHours}h)`);
            console.log(`   💰 Result: $${trade.resultUSD} (${trade.resultPercent}%)`);
        }

        // Update balance
        this.updateBalance(trade.resultUSD);
        
        // Register trade
        this.trades.push(trade);
        
        // Register daily result
        this.recordDailyResult(signal.date, trade);

        return trade;
    }

    /**
     * Simulates a complete trade without internal logs (silent version)
     * @param {Object} signal - Trading signal
     * @param {Array} remainingCandles - Remaining candles to simulate
     * @returns {Object} Simulated trade result
     */
    simulateTradeSilent(signal, remainingCandles) {
        const trade = {
            id: `trade_${this.trades.length + 1}`,
            signal: signal,
            entryPrice: signal.entryPrice,
            entryTime: signal.candle.openTime,
            direction: signal.direction,
            positionSize: this.currentBalance * this.leverage,
            leverage: this.leverage,
            stopLoss: this.calculateStopLoss(signal.entryPrice, signal.direction),
            takeProfit: this.calculateTakeProfit(signal.entryPrice, signal.direction),
            exitPrice: null,
            exitTime: null,
            exitReason: null,
            resultUSD: 0,
            resultPercent: 0,
            durationHours: 0
        };

        // Simular hasta encontrar salida (sin logs)
        for (let i = 0; i < remainingCandles.length; i++) {
            const candle = remainingCandles[i];
            const exitCondition = this.checkExitConditions(candle, trade);

            if (exitCondition) {
                trade.exitPrice = exitCondition.price;
                trade.exitTime = candle.openTime;
                trade.exitReason = exitCondition.reason;
                trade.durationHours = DateUtils.getHoursDifference(trade.entryTime, trade.exitTime);
                
                // Calculate result
                const result = this.calculateTradeResult(trade);
                trade.resultUSD = result.usd;
                trade.resultPercent = result.percent;
                break;
            }
        }

        // If not closed, close at end of day
        if (!trade.exitPrice) {
            const lastCandle = remainingCandles[remainingCandles.length - 1];
            trade.exitPrice = lastCandle.close;
            trade.exitTime = lastCandle.openTime;
            trade.exitReason = 'END_OF_DAY';
            trade.durationHours = DateUtils.getHoursDifference(trade.entryTime, trade.exitTime);
            
            const result = this.calculateTradeResult(trade);
            trade.resultUSD = result.usd;
            trade.resultPercent = result.percent;
        }

        // Update balance
        this.updateBalance(trade.resultUSD);
        
        // Register trade
        this.trades.push(trade);
        
        // Register daily result
        this.recordDailyResult(signal.date, trade);

        return trade;
    }

    /**
     * Calculates stop loss price
     * @param {number} entryPrice - Entry price
     * @param {string} direction - Trade direction
     * @returns {number} Stop loss price
     */
    calculateStopLoss(entryPrice, direction) {
        return MathUtils.calculateStopLoss(entryPrice, direction, this.leverage, this.stopLossPercent);
    }

    /**
     * Calculates take profit price
     * @param {number} entryPrice - Entry price
     * @param {string} direction - Trade direction
     * @returns {number} Take profit price
     */
    calculateTakeProfit(entryPrice, direction) {
        return MathUtils.calculateTakeProfit(entryPrice, direction, this.leverage, this.takeProfitPercent);
    }

    /**
     * Checks exit conditions for a trade
     * @param {Object} candle - Current candle
     * @param {Object} trade - Trade to check
     * @returns {Object|null} Exit condition or null
     */
    checkExitConditions(candle, trade) {
        // Check time closure (configurable)
        if (DateUtils.shouldCloseByTime(trade.entryTime, candle.openTime, this.maxHours)) {
            return {
                price: candle.close,
                reason: 'TIME'
            };
        }

        // Check Stop Loss
        if (trade.direction === 'LONG' && candle.low <= trade.stopLoss) {
            return {
                price: trade.stopLoss,
                reason: 'SL'
            };
        }

        if (trade.direction === 'SHORT' && candle.high >= trade.stopLoss) {
            return {
                price: trade.stopLoss,
                reason: 'SL'
            };
        }

        // Check Take Profit
        if (trade.direction === 'LONG' && candle.high >= trade.takeProfit) {
            return {
                price: trade.takeProfit,
                reason: 'TP'
            };
        }

        if (trade.direction === 'SHORT' && candle.low <= trade.takeProfit) {
            return {
                price: trade.takeProfit,
                reason: 'TP'
            };
        }

        return null; // No exit condition
    }

    /**
     * Calculates the result of a trade
     * @param {Object} trade - Completed trade
     * @returns {Object} Result in USD and percentage
     */
    calculateTradeResult(trade) {
        const pricePercent = MathUtils.calculateTradeResultPercent(
            trade.entryPrice, 
            trade.exitPrice, 
            trade.direction
        );
        
        // The USD result is the percentage applied to the CURRENT capital with leverage
        // With 5x leverage: 1% price gain = 5% capital gain
        const resultUSD = (pricePercent / 100) * this.currentBalance * this.leverage;
        
        // The displayed percentage should reflect the real impact on capital
        const capitalPercent = pricePercent * this.leverage;
        
        return {
            usd: MathUtils.round(resultUSD, 2),
            percent: MathUtils.round(capitalPercent, 2)
        };
    }

    /**
     * Updates the cumulative balance
     * @param {number} tradeResult - Trade result in USD
     */
    updateBalance(tradeResult) {
        this.currentBalance += tradeResult;
        this.currentBalance = MathUtils.round(this.currentBalance, 2);
    }

    /**
     * Records the daily result
     * @param {string} date - Trade date
     * @param {Object} trade - Completed trade
     */
    recordDailyResult(date, trade) {
        this.dailyResults[date] = {
            tradeExecuted: true,
            trade: trade,
            balanceBefore: this.currentBalance - trade.resultUSD,
            balanceAfter: this.currentBalance,
            dailyReturn: trade.resultUSD
        };
    }

    /**
     * Records a day without trade
     * @param {string} date - Date without trade
     */
    recordNoTradeDay(date) {
        this.dailyResults[date] = {
            tradeExecuted: false,
            reason: 'No breakout detected',
            balanceBefore: this.currentBalance,
            balanceAfter: this.currentBalance,
            dailyReturn: 0
        };
    }

    /**
     * Gets statistics of all trades
     * @returns {Object} Performance statistics
     */
    getTradingStats() {
        const winningTrades = this.trades.filter(t => t.resultUSD > 0);
        const losingTrades = this.trades.filter(t => t.resultUSD < 0);
        
        const totalReturn = this.currentBalance - this.initialCapital;
        const totalReturnPercent = (totalReturn / this.initialCapital) * 100;
        
        const winRate = this.trades.length > 0 ? (winningTrades.length / this.trades.length) * 100 : 0;
        
        const avgWin = winningTrades.length > 0 ? 
            winningTrades.reduce((sum, t) => sum + t.resultUSD, 0) / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? 
            Math.abs(losingTrades.reduce((sum, t) => sum + t.resultUSD, 0) / losingTrades.length) : 0;
        
        return {
            totalTrades: this.trades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate: MathUtils.round(winRate, 2),
            initialCapital: this.initialCapital,
            finalBalance: this.currentBalance,
            totalReturn: MathUtils.round(totalReturn, 2),
            totalReturnPercent: MathUtils.round(totalReturnPercent, 2),
            avgWin: MathUtils.round(avgWin, 2),
            avgLoss: MathUtils.round(avgLoss, 2),
        };
    }

    /**
     * Gets daily results
     * @returns {Object} Results by day
     */
    getDailyResults() {
        return this.dailyResults;
    }

    /**
     * Gets all trades
     * @returns {Array} Array of trades
     */
    getTrades() {
        return this.trades;
    }
}

export default TradeSimulator;
