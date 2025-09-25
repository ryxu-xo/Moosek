/**
 * @fileoverview Helper utilities for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

/**
 * Utility functions for the bot
 */
class Helpers {
    /**
     * Formats time from milliseconds to readable format
     * @param {number} ms - Time in milliseconds
     * @returns {string} Formatted time string
     */
    static formatTime(ms) {
        if (!ms || ms === 0) return '0:00';
        
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
    }

    /**
     * Creates a progress bar for the current track
     * @param {number} current - Current position in milliseconds
     * @param {number} total - Total duration in milliseconds
     * @param {number} length - Length of the progress bar (default: 20)
     * @returns {string} Progress bar string
     */
    static createProgressBar(current, total, length = 20) {
        if (!current || !total || total === 0) return '░'.repeat(length);
        
        const progress = Math.round((current / total) * length);
        const empty = length - progress;
        
        return `\`${'█'.repeat(progress)}${'░'.repeat(empty)}\``;
    }

    /**
     * Truncates text to a specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    static truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * Generates a random color for embeds
     * @returns {number} Random color value
     */
    static getRandomColor() {
        const colors = [
            0x00ff00, // Green
            0xff6b6b, // Red
            0x4ecdc4, // Teal
            0x45b7d1, // Blue
            0xf9ca24, // Yellow
            0xf0932b, // Orange
            0xeb4d4b, // Pink
            0x6c5ce7, // Purple
            0xa29bfe, // Light Purple
            0xfd79a8  // Light Pink
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Checks if a user has DJ permissions
     * @param {GuildMember} member - The guild member
     * @param {Object} guildSettings - Guild settings from database
     * @returns {boolean} Whether the user has DJ permissions
     */
    static hasDJPermissions(member, guildSettings) {
        // Check if user has DJ role
        if (guildSettings?.dj_role_id) {
            return member.roles.cache.has(guildSettings.dj_role_id);
        }

        // Check if user has manage guild permission
        return member.permissions.has('ManageGuild');
    }

    /**
     * Validates a YouTube URL
     * @param {string} url - URL to validate
     * @returns {boolean} Whether the URL is valid
     */
    static isValidYouTubeURL(url) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        return youtubeRegex.test(url);
    }

    /**
     * Validates a Spotify URL
     * @param {string} url - URL to validate
     * @returns {boolean} Whether the URL is valid
     */
    static isValidSpotifyURL(url) {
        const spotifyRegex = /^(https?:\/\/)?(open\.)?spotify\.com\/.+/;
        return spotifyRegex.test(url);
    }

    /**
     * Validates a SoundCloud URL
     * @param {string} url - URL to validate
     * @returns {boolean} Whether the URL is valid
     */
    static isValidSoundCloudURL(url) {
        const soundcloudRegex = /^(https?:\/\/)?(www\.)?soundcloud\.com\/.+/;
        return soundcloudRegex.test(url);
    }

    /**
     * Determines the best search source based on URL
     * @param {string} query - Search query or URL
     * @returns {string} Recommended search source
     */
    static getRecommendedSource(query) {
        if (this.isValidYouTubeURL(query)) {
            return 'ytsearch';
        } else if (this.isValidSpotifyURL(query)) {
            return 'spsearch';
        } else if (this.isValidSoundCloudURL(query)) {
            return 'scsearch';
        } else {
            return 'ytmsearch'; // Default to YouTube Music
        }
    }

    /**
     * Formats a number with commas
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    static formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Calculates the percentage of a value
     * @param {number} value - Current value
     * @param {number} total - Total value
     * @returns {number} Percentage (0-100)
     */
    static calculatePercentage(value, total) {
        if (!total || total === 0) return 0;
        return Math.round((value / total) * 100);
    }

    /**
     * Generates a random string of specified length
     * @param {number} length - Length of the string
     * @returns {string} Random string
     */
    static generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Debounces a function call
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttles a function call
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

module.exports = Helpers;
