import fs from 'fs/promises';
import path from 'path';
import DataFormatter from './dataFormatter.js';

class ResultsExporter {
    constructor(outputDir = './results') {
        this.outputDir = outputDir;
        this.formatter = new DataFormatter();
    }

    /**
     * Exports backtesting results to a JSON file
     * @param {Object} backtestData - Backtesting data
     * @param {string} symbol - Trading pair symbol
     * @param {Array} candles - Array of candles
     * @param {Object} config - Backtesting configuration
     * @returns {Promise<string>} Path of generated file
     */
    async exportToJSON(backtestData, symbol, candles, config) {
        try {
            // Format data
            const formattedData = this.formatBacktestData(backtestData, symbol, candles, config);

            // Validate data
            if (!this.formatter.validateData(formattedData)) {
                throw new Error('Data validation failed');
            }

            // Generate filename
            const filename = this.generateFilename(symbol, candles);
            const filepath = path.join(this.outputDir, filename);

            // Create directory if it doesn't exist
            await this.ensureOutputDir();

            // Write file
            await fs.writeFile(filepath, JSON.stringify(formattedData, null, 2), 'utf8');

            console.log(`✅ Results exported to: ${filepath}`);
            return filepath;

        } catch (error) {
            console.error('❌ Export error:', error.message);
            throw error;
        }
    }

    /**
     * Formats all backtesting data
     * @param {Object} backtestData - Backtesting data
     * @param {string} symbol - Trading pair symbol
     * @param {Array} candles - Array of candles
     * @param {Object} config - Backtesting configuration
     * @returns {Object} Formatted data
     */
    formatBacktestData(backtestData, symbol, candles, config) {
        return {
            metadata: this.formatter.formatMetadata(symbol, candles, config),
            dailyResults: this.formatter.formatDailyResults(backtestData.dailyResults),
            summary: this.formatter.formatSummary(backtestData.tradingStats)
        };
    }

    /**
     * Generates filename based on symbol and dates
     * @param {string} symbol - Trading pair symbol
     * @param {Array} candles - Array of candles
     * @returns {string} Filename
     */
    generateFilename(symbol, candles) {
        const startDate = this.getDateOnly(candles[0].openTime);
        const endDate = this.getDateOnly(candles[candles.length - 1].openTime);
        
        return `${symbol}_${startDate}_to_${endDate}.json`;
    }

    /**
     * Ensures the output directory exists
     */
    async ensureOutputDir() {
        try {
            await fs.access(this.outputDir);
        } catch (error) {
            // Directory doesn't exist, create it
            await fs.mkdir(this.outputDir, { recursive: true });
            console.log(`📁 Created output directory: ${this.outputDir}`);
        }
    }

    /**
     * Gets only the date from a timestamp
     * @param {number} timestamp - Timestamp in milliseconds
     * @returns {string} Date in YYYY-MM-DD format
     */
    getDateOnly(timestamp) {
        const date = new Date(timestamp);
        return date.toISOString().split('T')[0];
    }

    /**
     * Checks if a file already exists
     * @param {string} filepath - File path
     * @returns {Promise<boolean>} True if file exists
     */
    async fileExists(filepath) {
        try {
            await fs.access(filepath);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets statistics of the generated file
     * @param {string} filepath - File path
     * @returns {Promise<Object>} File statistics
     */
    async getFileStats(filepath) {
        try {
            const stats = await fs.stat(filepath);
            return {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };
        } catch (error) {
            throw new Error(`Failed to get file stats: ${error.message}`);
        }
    }

    /**
     * Exports only metadata (lightweight version)
     * @param {Object} backtestData - Backtesting data
     * @param {string} symbol - Trading pair symbol
     * @param {Array} candles - Array of candles
     * @param {Object} config - Backtesting configuration
     * @returns {Promise<string>} Path of generated file
     */
    async exportMetadataOnly(backtestData, symbol, candles, config) {
        try {
            const metadata = this.formatter.formatMetadata(symbol, candles, config);
            const summary = this.formatter.formatSummary(backtestData.tradingStats);

            const lightweightData = {
                metadata: metadata,
                summary: summary
            };

            const filename = this.generateFilename(symbol, candles).replace('.json', '_summary.json');
            const filepath = path.join(this.outputDir, filename);

            await this.ensureOutputDir();
            await fs.writeFile(filepath, JSON.stringify(lightweightData, null, 2), 'utf8');

            console.log(`✅ Summary exported to: ${filepath}`);
            return filepath;

        } catch (error) {
            console.error('❌ Metadata export error:', error.message);
            throw error;
        }
    }
}

export default ResultsExporter;
