import DateUtils from '../utils/dateUtils.js';

class DataFormatter {
    /**
     * Formats backtesting metadata
     * @param {string} symbol - Trading pair symbol
     * @param {Array} candles - Array of candles
     * @param {Object} config - Backtesting configuration
     * @returns {Object} Formatted metadata
     */
    formatMetadata(symbol, candles, config) {
        const startDate = DateUtils.getDateOnly(candles[0].openTime);
        const endDate = DateUtils.getDateOnly(candles[candles.length - 1].openTime);
        const totalDays = DateUtils.getDaysDifference(startDate, endDate) + 1;

        return {
            symbol: symbol,
            startDate: startDate,
            endDate: endDate,
            totalDays: totalDays,
            strategy: 'breakout',
            parameters: {
                initialCapital: config.capital,
                leverage: config.leverage,
                maxHours: config.maxHours,
                stopLossPercent: config.stopLossPercent,
                takeProfitPercent: config.takeProfitPercent
            },
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Formats daily results
     * @param {Object} dailyResults - Daily results from simulator
     * @returns {Object} Formatted daily results
     */
    formatDailyResults(dailyResults) {
        const formattedResults = {};

        Object.entries(dailyResults).forEach(([date, result]) => {
            formattedResults[date] = {
                tradeExecuted: result.tradeExecuted,
                balanceBefore: result.balanceBefore,
                balanceAfter: result.balanceAfter,
                dailyReturn: result.dailyReturn
            };

            if (result.tradeExecuted && result.trade) {
                formattedResults[date].trade = {
                    id: result.trade.id,
                    direction: result.trade.direction,
                    entryPrice: result.trade.entryPrice,
                    exitPrice: result.trade.exitPrice,
                    exitReason: result.trade.exitReason,
                    durationHours: result.trade.durationHours,
                    resultUSD: result.trade.resultUSD,
                    resultPercent: result.trade.resultPercent,
                    stopLoss: result.trade.stopLoss,
                    takeProfit: result.trade.takeProfit
                };
            } else {
                formattedResults[date].reason = result.reason || 'No breakout detected';
            }
        });

        return formattedResults;
    }

    /**
     * Formats statistical summary
     * @param {Object} tradingStats - Statistics from simulator
     * @returns {Object} Formatted summary
     */
    formatSummary(tradingStats) {
        return {
            totalTrades: tradingStats.totalTrades,
            winningTrades: tradingStats.winningTrades,
            losingTrades: tradingStats.losingTrades,
            winRate: tradingStats.winRate,
            totalReturn: tradingStats.totalReturn,
            totalReturnPercent: tradingStats.totalReturnPercent,
            finalBalance: tradingStats.finalBalance,
            avgWin: tradingStats.avgWin,
            avgLoss: tradingStats.avgLoss,
            maxDrawdown: this.calculateMaxDrawdown(tradingStats),
            maxDrawdownPercent: this.calculateMaxDrawdownPercent(tradingStats)
        };
    }

    /**
     * Calculates maximum drawdown (simplified)
     * @param {Object} tradingStats - Statistics from simulator
     * @returns {number} Maximum drawdown in USD
     */
    calculateMaxDrawdown(tradingStats) {
        // Simplified implementation - in a more advanced version
        // real drawdown would be calculated based on historical balance
        return Math.abs(tradingStats.avgLoss) * 3; // Estimation
    }

    /**
     * Calculates maximum drawdown in percentage
     * @param {Object} tradingStats - Statistics from simulator
     * @returns {number} Maximum drawdown in percentage
     */
    calculateMaxDrawdownPercent(tradingStats) {
        const maxDrawdown = this.calculateMaxDrawdown(tradingStats);
        return (maxDrawdown / tradingStats.initialCapital) * 100;
    }

    /**
     * Validates data structure before exporting
     * @param {Object} data - Data to validate
     * @returns {boolean} True if data is valid
     */
    validateData(data) {
        try {
            // Validate metadata
            if (!data.metadata || !data.metadata.symbol) {
                throw new Error('Missing metadata or symbol');
            }

            // Validate daily results
            if (!data.dailyResults || typeof data.dailyResults !== 'object') {
                throw new Error('Missing or invalid dailyResults');
            }

            // Validate summary
            if (!data.summary || typeof data.summary !== 'object') {
                throw new Error('Missing or invalid summary');
            }

            // Validate dates
            const dates = Object.keys(data.dailyResults);
            if (dates.length === 0) {
                throw new Error('No daily results found');
            }

            // Validate balance consistency
            this.validateBalanceConsistency(data.dailyResults);

            return true;
        } catch (error) {
            console.error('❌ Data validation error:', error.message);
            return false;
        }
    }

    /**
     * Validates balance consistency
     * @param {Object} dailyResults - Daily results
     */
    validateBalanceConsistency(dailyResults) {
        const dates = Object.keys(dailyResults).sort();
        let expectedBalance = null;

        for (const date of dates) {
            const result = dailyResults[date];
            
            if (expectedBalance !== null) {
                // Round to 2 decimals to avoid precision issues
                const expectedRounded = Math.round(expectedBalance * 100) / 100;
                const actualRounded = Math.round(result.balanceBefore * 100) / 100;
                
                if (actualRounded !== expectedRounded) {
                    throw new Error(`Balance inconsistency on ${date}: expected ${expectedRounded}, got ${actualRounded}`);
                }
            }

            expectedBalance = result.balanceAfter;
        }
    }
}

export default DataFormatter;
