/**
 * @fileoverview Database manager for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const Logger = require('../utils/logger');

/**
 * Database manager class using SQLite3
 */
class DatabaseManager {
    /**
     * Creates a new DatabaseManager instance
     */
    constructor() {
        this.db = null;
        this.initializeDatabase();
    }

    /**
     * Initializes the database connection and creates tables
     */
    initializeDatabase() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(config.database.path);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Connect to database
            this.db = new sqlite3.Database(config.database.path, (err) => {
                if (err) {
                    Logger.error('Database connection error:', err);
                } else {
                    Logger.success('Database connected successfully');
                    this.createTables();
                }
            });

        } catch (error) {
            Logger.error('Failed to initialize database:', error);
        }
    }

    /**
     * Creates all necessary database tables
     */
    createTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id TEXT PRIMARY KEY,
                music_channel_id TEXT,
                dj_role_id TEXT,
                auto_play BOOLEAN DEFAULT 1,
                max_queue_size INTEGER DEFAULT 100,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS user_preferences (
                user_id TEXT PRIMARY KEY,
                volume INTEGER DEFAULT 50,
                auto_shuffle BOOLEAN DEFAULT 0,
                show_lyrics BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS playlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                guild_id TEXT,
                name TEXT NOT NULL,
                description TEXT,
                is_public BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, name)
            )`,
            `CREATE TABLE IF NOT EXISTS playlist_tracks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                playlist_id INTEGER NOT NULL,
                track_title TEXT NOT NULL,
                track_author TEXT NOT NULL,
                track_url TEXT NOT NULL,
                track_duration INTEGER NOT NULL,
                track_thumbnail TEXT,
                position INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS music_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                track_title TEXT NOT NULL,
                track_author TEXT NOT NULL,
                play_duration INTEGER NOT NULL,
                played_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS bot_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                stat_name TEXT UNIQUE NOT NULL,
                stat_value TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        tables.forEach((sql, index) => {
            this.db.run(sql, (err) => {
                if (err) {
                    Logger.error(`Error creating table ${index + 1}:`, err);
                } else {
                    Logger.debug(`Table ${index + 1} created/verified`);
                }
            });
        });
    }

    /**
     * Gets guild settings
     * @param {string} guildId - The guild ID
     * @returns {Promise<Object|null>} Guild settings or null if not found
     */
    getGuildSettings(guildId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM guild_settings WHERE guild_id = ?';
            this.db.get(sql, [guildId], (err, row) => {
                if (err) {
                    Logger.error('Error getting guild settings:', err);
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }

    /**
     * Sets guild settings
     * @param {string} guildId - The guild ID
     * @param {Object} settings - Settings to update
     */
    setGuildSettings(guildId, settings) {
        const sql = `INSERT OR REPLACE INTO guild_settings 
            (guild_id, music_channel_id, dj_role_id, auto_play, max_queue_size, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
        
        this.db.run(sql, [
            guildId,
            settings.music_channel_id || null,
            settings.dj_role_id || null,
            settings.auto_play || 1,
            settings.max_queue_size || 100
        ], (err) => {
            if (err) {
                Logger.error('Error setting guild settings:', err);
            }
        });
    }

    /**
     * Gets user preferences
     * @param {string} userId - The user ID
     * @returns {Promise<Object|null>} User preferences or null if not found
     */
    getUserPreferences(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM user_preferences WHERE user_id = ?';
            this.db.get(sql, [userId], (err, row) => {
                if (err) {
                    Logger.error('Error getting user preferences:', err);
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }

    /**
     * Sets user preferences
     * @param {string} userId - The user ID
     * @param {Object} preferences - Preferences to update
     */
    setUserPreferences(userId, preferences) {
        const sql = `INSERT OR REPLACE INTO user_preferences 
            (user_id, volume, auto_shuffle, show_lyrics, created_at, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
        
        this.db.run(sql, [
            userId,
            preferences.volume || 50,
            preferences.auto_shuffle || 0,
            preferences.show_lyrics || 1
        ], (err) => {
            if (err) {
                Logger.error('Error setting user preferences:', err);
            }
        });
    }

    /**
     * Creates a new playlist
     * @param {string} userId - The user ID
     * @param {string} name - Playlist name
     * @param {string} description - Playlist description
     * @param {string} guildId - Guild ID (optional)
     * @param {boolean} isPublic - Whether playlist is public
     * @returns {Promise<number|null>} Playlist ID or null if error
     */
    createPlaylist(userId, name, description = '', guildId = null, isPublic = false) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO playlists (user_id, guild_id, name, description, is_public, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
            
            this.db.run(sql, [userId, guildId, name, description, isPublic ? 1 : 0], function(err) {
                if (err) {
                    Logger.error('Error creating playlist:', err);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    /**
     * Gets user's playlists
     * @param {string} userId - The user ID
     * @param {string} guildId - Guild ID (optional)
     * @returns {Promise<Array>} Array of playlists
     */
    getUserPlaylists(userId, guildId = null) {
        return new Promise((resolve, reject) => {
            let sql, params;
            if (guildId) {
                sql = `SELECT * FROM playlists 
                    WHERE user_id = ? AND (guild_id = ? OR guild_id IS NULL)
                    ORDER BY created_at DESC`;
                params = [userId, guildId];
            } else {
                sql = `SELECT * FROM playlists 
                    WHERE user_id = ?
                    ORDER BY created_at DESC`;
                params = [userId];
            }
            
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    Logger.error('Error getting user playlists:', err);
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Adds a track to a playlist
     * @param {number} playlistId - The playlist ID
     * @param {Object} track - Track information
     * @param {number} position - Position in playlist
     */
    addTrackToPlaylist(playlistId, track, position = 0) {
        const sql = `INSERT INTO playlist_tracks 
            (playlist_id, track_title, track_author, track_url, track_duration, track_thumbnail, position, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
        
        this.db.run(sql, [
            playlistId,
            track.title,
            track.author,
            track.url,
            track.duration,
            track.thumbnail || '',
            position
        ], (err) => {
            if (err) {
                Logger.error('Error adding track to playlist:', err);
            }
        });
    }

    /**
     * Gets playlist tracks
     * @param {number} playlistId - The playlist ID
     * @returns {Promise<Array>} Array of tracks
     */
    getPlaylistTracks(playlistId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM playlist_tracks 
                WHERE playlist_id = ? 
                ORDER BY position ASC`;
            
            this.db.all(sql, [playlistId], (err, rows) => {
                if (err) {
                    Logger.error('Error getting playlist tracks:', err);
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Records music statistics
     * @param {string} guildId - The guild ID
     * @param {string} userId - The user ID
     * @param {Object} track - Track information
     * @param {number} playDuration - Duration played in milliseconds
     */
    recordMusicStats(guildId, userId, track, playDuration) {
        const sql = `INSERT INTO music_stats (guild_id, user_id, track_title, track_author, play_duration, played_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
        
        this.db.run(sql, [guildId, userId, track.title, track.author, playDuration], (err) => {
            if (err) {
                Logger.error('Error recording music stats:', err);
            }
        });
    }

    /**
     * Gets bot statistics
     * @param {string} statName - The statistic name
     * @returns {Promise<string|null>} Statistic value or null if not found
     */
    getBotStat(statName) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT stat_value FROM bot_stats WHERE stat_name = ?';
            this.db.get(sql, [statName], (err, row) => {
                if (err) {
                    Logger.error('Error getting bot stat:', err);
                    reject(err);
                } else {
                    resolve(row ? row.stat_value : null);
                }
            });
        });
    }

    /**
     * Sets bot statistics
     * @param {string} statName - The statistic name
     * @param {string} statValue - The statistic value
     */
    setBotStat(statName, statValue) {
        const sql = `INSERT OR REPLACE INTO bot_stats (stat_name, stat_value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)`;
        
        this.db.run(sql, [statName, statValue], (err) => {
            if (err) {
                Logger.error('Error setting bot stat:', err);
            }
        });
    }

    /**
     * Closes the database connection
     */
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    Logger.error('Error closing database:', err);
                } else {
                    Logger.info('Database connection closed');
                }
            });
        }
    }
}

module.exports = DatabaseManager;