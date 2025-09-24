import moment from 'moment';

class DateUtils {
    /**
     * Converts timestamp to readable date
     * @param {number} timestamp - Timestamp in milliseconds
     * @returns {string} Formatted date
     */
    static formatDate(timestamp) {
        return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
    }

    /**
     * Gets only the date (without time) from a timestamp
     * @param {number} timestamp - Timestamp in milliseconds
     * @returns {string} Date in YYYY-MM-DD format
     */
    static getDateOnly(timestamp) {
        return moment(timestamp).format('YYYY-MM-DD');
    }

    /**
     * Checks if two timestamps are from the same day
     * @param {number} timestamp1 - First timestamp
     * @param {number} timestamp2 - Second timestamp
     * @returns {boolean} True if they are from the same day
     */
    static isSameDay(timestamp1, timestamp2) {
        return moment(timestamp1).isSame(moment(timestamp2), 'day');
    }

    /**
     * Groups candles by day
     * @param {Array} candles - Array of candles
     * @returns {Object} Object with candles grouped by day
     */
    static groupCandlesByDay(candles) {
        const grouped = {};
        
        candles.forEach(candle => {
            const date = this.getDateOnly(candle.openTime);
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(candle);
        });
        
        return grouped;
    }

    /**
     * Calculates the difference in hours between two timestamps
     * @param {number} startTime - Start timestamp
     * @param {number} endTime - End timestamp
     * @returns {number} Difference in hours
     */
    static getHoursDifference(startTime, endTime) {
        return moment(endTime).diff(moment(startTime), 'hours');
    }

    /**
     * Checks if maximum hours have passed to close a trade
     * @param {number} entryTime - Entry timestamp
     * @param {number} currentTime - Current timestamp
     * @param {number} maxHours - Maximum hours (default: 3)
     * @returns {boolean} True if should close by time
     */
    static shouldCloseByTime(entryTime, currentTime, maxHours = 3) {
        const hoursPassed = this.getHoursDifference(entryTime, currentTime);
        return hoursPassed >= maxHours;
    }

    /**
     * Gets the timestamp of the start of the day
     * @param {number} timestamp - Reference timestamp
     * @returns {number} Start of day timestamp
     */
    static getStartOfDay(timestamp) {
        return moment(timestamp).startOf('day').valueOf();
    }

    /**
     * Gets the timestamp of the end of the day
     * @param {number} timestamp - Reference timestamp
     * @returns {number} End of day timestamp
     */
    static getEndOfDay(timestamp) {
        return moment(timestamp).endOf('day').valueOf();
    }

    /**
     * Gets the difference in days between two dates
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {number} Difference in days
     */
    static getDaysDifference(startDate, endDate) {
        const start = moment(startDate);
        const end = moment(endDate);
        return end.diff(start, 'days');
    }
}

export default DateUtils;
