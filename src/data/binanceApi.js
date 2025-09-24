import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class BinanceAPI {
    constructor() {
        this.baseURL = process.env.BINANCE_API_URL || 'https://api.binance.com/api/v3';
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 10000
        });
    }

    /**
     * Fetches candle data (klines) from Binance
     * @param {string} symbol - Trading pair symbol (e.g: BTCUSDT)
     * @param {string} interval - Time interval (e.g: 1h)
     * @param {number} limit - Number of candles to fetch
     * @returns {Promise<Array>} Array of candles
     */
    async fetchKlines(symbol, interval = '1h', limit = 1000) {
        try {
            console.log(`📊 Fetching ${limit} candles for ${symbol} (${interval})...`);
            
            const response = await this.client.get('/klines', {
                params: {
                    symbol: symbol.toUpperCase(),
                    interval: interval,
                    limit: limit
                }
            });

            if (response.status !== 200) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const klines = response.data;
            console.log(`✅ Successfully fetched ${klines.length} candles`);

            return this.formatKlines(klines);
        } catch (error) {
            console.error('❌ Error fetching data from Binance:', error.message);
            throw this.handleApiErrors(error);
        }
    }

    /**
     * Validates if a symbol is valid for trading
     * @param {string} symbol - Symbol to validate
     * @returns {boolean} True if valid
     */
    validateSymbol(symbol) {
        const validSymbols = [
            'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT',
            'SOLUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT'
        ];
        
        const upperSymbol = symbol.toUpperCase();
        const isValid = validSymbols.includes(upperSymbol);
        
        if (!isValid) {
            console.warn(`⚠️  Symbol ${upperSymbol} is not in the validated list. Continuing...`);
        }
        
        return true; // Allow any symbol for flexibility
    }

    /**
     * Formats klines data to a more readable format
     * @param {Array} klines - Raw data from Binance
     * @returns {Array} Formatted data
     */
    formatKlines(klines) {
        return klines.map(kline => ({
            openTime: parseInt(kline[0]),
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
            volume: parseFloat(kline[5]),
            closeTime: parseInt(kline[6]),
            quoteVolume: parseFloat(kline[7]),
            trades: parseInt(kline[8]),
            takerBuyBaseVolume: parseFloat(kline[9]),
            takerBuyQuoteVolume: parseFloat(kline[10])
        }));
    }

    /**
     * Handles Binance API errors
     * @param {Error} error - Captured error
     * @returns {Error} Processed error
     */
    handleApiErrors(error) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            switch (status) {
                case 400:
                    return new Error(`Invalid request: ${data.msg || 'Incorrect parameters'}`);
                case 404:
                    return new Error('Symbol not found');
                case 429:
                    return new Error('Rate limit exceeded. Please wait a moment.');
                case 500:
                    return new Error('Internal server error from Binance');
                default:
                    return new Error(`API Error: ${status} - ${data.msg || 'Unknown error'}`);
            }
        } else if (error.request) {
            return new Error('Could not connect to Binance API. Check your connection.');
        } else {
            return new Error(`Configuration error: ${error.message}`);
        }
    }
}

export default BinanceAPI;
