class MathUtils {
    /**
     * Calculates the percentage change between two prices
     * @param {number} oldPrice - Previous price
     * @param {number} newPrice - New price
     * @returns {number} Percentage change
     */
    static calculatePercentageChange(oldPrice, newPrice) {
        return ((newPrice - oldPrice) / oldPrice) * 100;
    }

    /**
     * Calculates stop loss price based on leverage
     * @param {number} entryPrice - Entry price
     * @param {string} direction - Trade direction (LONG/SHORT)
     * @param {number} leverage - Leverage
     * @param {number} riskPercent - Risk percentage of capital (default: 10%)
     * @returns {number} Stop loss price
     */
    static calculateStopLoss(entryPrice, direction, leverage, riskPercent = 10) {
        // Convert capital risk to price risk
        // With 5x leverage: 10% of capital = 2% of price
        const priceRiskPercent = riskPercent / leverage;
        const priceChange = (priceRiskPercent / 100) * entryPrice;
        
        if (direction === 'LONG') {
            return entryPrice - priceChange;
        } else {
            return entryPrice + priceChange;
        }
    }

    /**
     * Calculates take profit price based on leverage
     * @param {number} entryPrice - Entry price
     * @param {string} direction - Trade direction (LONG/SHORT)
     * @param {number} leverage - Leverage
     * @param {number} profitPercent - Profit percentage of capital (default: 20%)
     * @returns {number} Take profit price
     */
    static calculateTakeProfit(entryPrice, direction, leverage, profitPercent = 20) {
        // Convert capital profit to price profit
        // With 5x leverage: 20% of capital = 4% of price
        const priceProfitPercent = profitPercent / leverage;
        const priceChange = (priceProfitPercent / 100) * entryPrice;
        
        if (direction === 'LONG') {
            return entryPrice + priceChange;
        } else {
            return entryPrice - priceChange;
        }
    }

    /**
     * Calculates the USD result of a trade
     * @param {number} entryPrice - Entry price
     * @param {number} exitPrice - Exit price
     * @param {string} direction - Trade direction
     * @param {number} positionSize - Position size in USD
     * @returns {number} Result in USD
     */
    static calculateTradeResult(entryPrice, exitPrice, direction, positionSize) {
        const priceChange = Math.abs(exitPrice - entryPrice);
        const priceChangePercent = priceChange / entryPrice;
        
        let result;
        if (direction === 'LONG') {
            result = exitPrice > entryPrice ? priceChangePercent * positionSize : -priceChangePercent * positionSize;
        } else {
            result = exitPrice < entryPrice ? priceChangePercent * positionSize : -priceChangePercent * positionSize;
        }
        
        return result;
    }

    /**
     * Calculates the percentage result of a trade
     * @param {number} entryPrice - Entry price
     * @param {number} exitPrice - Exit price
     * @param {string} direction - Trade direction
     * @returns {number} Result in percentage
     */
    static calculateTradeResultPercent(entryPrice, exitPrice, direction) {
        if (direction === 'LONG') {
            return ((exitPrice - entryPrice) / entryPrice) * 100;
        } else {
            return ((entryPrice - exitPrice) / entryPrice) * 100;
        }
    }

    /**
     * Rounds a number to a specific number of decimals
     * @param {number} number - Number to round
     * @param {number} decimals - Number of decimals (default: 2)
     * @returns {number} Rounded number
     */
    static round(number, decimals = 2) {
        return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }

    /**
     * Calculates the maximum of an array of numbers
     * @param {Array} numbers - Array of numbers
     * @returns {number} Maximum value
     */
    static max(numbers) {
        return Math.max(...numbers);
    }

    /**
     * Calculates the minimum of an array of numbers
     * @param {Array} numbers - Array of numbers
     * @returns {number} Minimum value
     */
    static min(numbers) {
        return Math.min(...numbers);
    }

    /**
     * Checks if a price has touched a level (considering tolerance)
     * @param {number} currentPrice - Current price
     * @param {number} targetPrice - Target price
     * @param {number} tolerance - Tolerance in percentage (default: 0.1%)
     * @returns {boolean} True if it has touched the level
     */
    static hasTouchedLevel(currentPrice, targetPrice, tolerance = 0.001) {
        const diff = Math.abs(currentPrice - targetPrice);
        const toleranceAmount = targetPrice * tolerance;
        return diff <= toleranceAmount;
    }
}

export default MathUtils;
