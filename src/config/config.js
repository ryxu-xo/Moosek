/**
 * @fileoverview Configuration management for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

require('dotenv').config();

/**
 * Main configuration object containing all bot settings
 * @type {Object}
 */
const config = {
    // Discord Bot Configuration
    discord: {
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.CLIENT_ID,
        guildId: process.env.GUILD_ID,
        intents: [
            'Guilds',
            'GuildVoiceStates',
            'GuildMessages',
            'MessageContent'
        ],
        partials: ['Channel']
    },

    // Lavalink Node Configuration
    lavalink: {
        nodes: [
            {
                name: 'main',
                host: process.env.LAVALINK_HOST || 'lava-v4.ajieblogs.eu.org',
                port: parseInt(process.env.LAVALINK_PORT) || 443,
                password: process.env.LAVALINK_PASSWORD || 'https://dsc.gg/ajidevserver',
                secure: process.env.LAVALINK_SECURE === 'true' || true,
                regions: ['us_central', 'us_east']
            }
        ],
        options: {
            defaultSearchPlatform: 'spsearch',
            enhancedPerformance: {
                enabled: true,
                connectionPooling: true,
                requestBatching: true,
                memoryOptimization: true
            },
            nodeSwitching: {
                enabled: true,
                healthCheckInterval: 30000,
                migrationThreshold: 0.7
            },
            persistence: {
                enabled: true,
                filePath: process.env.PERSISTENCE_FILE || './data/euralink-state.json',
                intervalMs: 60000
            },
            eurasync: {
                enabled: true,
                template: '🎵 {title} by {author}'
            },
            metrics: {
                enabled: true,
                port: parseInt(process.env.METRICS_PORT) || 9090
            },
            logs: {
                json: false
            },
            debug: process.env.NODE_ENV === 'development',
            resume: {
                enabled: true,
                key: 'moosek-music-bot',
                timeout: 60000
            },
            activityStatus: {
                enabled: true,
                template: '🎵 {title} by {author}'
            }
        }
    },

    // Bot Settings
    bot: {
        name: 'Moosek',
        version: '1.0.0',
        ownerId: process.env.OWNER_ID,
        supportGuildId: process.env.SUPPORT_GUILD_ID
    },

    // Database Configuration
    database: {
        path: process.env.DATABASE_PATH || './data/moosek.db',
        type: 'sqlite'
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: {
            enabled: true,
            path: './logs/moosek.log',
            maxSize: '10m',
            maxFiles: 5
        },
        console: {
            enabled: true,
            colorize: true
        }
    },

    // Music Player Default Settings
    music: {
        defaultVolume: 50,
        maxVolume: 1000,
        fadeInMs: 2000,
        crossfadeDurationMs: 1000,
        voiceResilience: {
            enabled: true,
            maxReconnectAttempts: 3,
            stuckThreshold: 30000
        },
        sponsorBlock: {
            enabled: true,
            categories: ['sponsor', 'selfpromo', 'interaction']
        }
    },

    // Command Configuration
    commands: {
        cooldown: 3000, // 3 seconds
        maxArgs: 10,
        deleteCommandMessages: false
    },

    // Error Handling
    errorHandling: {
        maxRetries: 3,
        retryDelay: 1000,
        logErrors: true
    }
};

/**
 * Validates the configuration and throws an error if required values are missing
 * @throws {Error} If required configuration values are missing
 */
function validateConfig() {
    const required = [
        'DISCORD_TOKEN',
        'CLIENT_ID'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate GUILD_ID format if provided
    const guildId = process.env.GUILD_ID;
    if (guildId && !/^\d{17,19}$/.test(guildId)) {
        console.warn(`Warning: GUILD_ID "${guildId}" is not a valid Discord snowflake. Commands will be registered globally.`);
    }
}

// Validate configuration on load
validateConfig();

module.exports = config;
