/**
 * @fileoverview Main client class for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('../config/config');
const CommandHandler = require('../handlers/commandHandler');
const EventHandler = require('../handlers/eventHandler');
const MusicManager = require('../music/musicManager');
const DatabaseManager = require('../database/database');
const Logger = require('../utils/logger');

/**
 * Extended Discord client class with custom functionality
 */
class MoosekClient extends Client {
    /**
     * Creates a new MoosekClient instance
     */
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ],
            partials: [Partials.Channel]
        });

        // Initialize managers
        this.commandHandler = new CommandHandler(this);
        this.eventHandler = new EventHandler(this);
        this.musicManager = new MusicManager(this);
        this.database = new DatabaseManager();

        // Bot statistics
        this.stats = {
            startTime: Date.now(),
            commandsExecuted: 0,
            tracksPlayed: 0,
            uptime: 0
        };

        // Setup error handling
        this.setupErrorHandling();
    }

    /**
     * Initializes the bot
     */
    async initialize() {
        try {
            Logger.startup('Initializing Moosek Music Bot...');

            // Load events first
            await this.eventHandler.loadEvents();

            // Load commands
            await this.commandHandler.loadCommands();

            // Login to Discord
            await this.login(config.discord.token);

            // Register slash commands after login
            await this.commandHandler.registerCommands();

            Logger.success('Bot initialization completed successfully');

        } catch (error) {
            Logger.error('Failed to initialize bot:', error);
            process.exit(1);
        }
    }

    /**
     * Sets up error handling for the client
     */
    setupErrorHandling() {
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            Logger.error('Uncaught Exception:', error);
            this.shutdown('uncaughtException');
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            this.shutdown('unhandledRejection');
        });

        // Handle client errors
        this.on('error', (error) => {
            Logger.error('Client error:', error);
        });

        // Handle warnings
        this.on('warn', (warning) => {
            Logger.warn('Client warning:', warning);
        });

        // Handle disconnections
        this.on('disconnect', () => {
            Logger.warn('Client disconnected from Discord');
        });

        // Handle reconnections
        this.on('reconnecting', () => {
            Logger.info('Client reconnecting to Discord...');
        });
    }

    /**
     * Gracefully shuts down the bot
     * @param {string} reason - Reason for shutdown
     */
    async shutdown(reason = 'manual') {
        try {
            Logger.shutdown({ reason });

            // Save player states
            if (this.musicManager) {
                await this.musicManager.savePlayerStates(config.lavalink.options.persistence.filePath);
            }

            // Save bot statistics
            if (this.database) {
                this.database.setBotStat('last_shutdown', new Date().toISOString());
                this.database.setBotStat('shutdown_reason', reason);
                this.database.close();
            }

            // Destroy all players
            if (this.musicManager) {
                const players = this.musicManager.getAllPlayers();
                for (const [guildId, player] of players) {
                    player.destroy();
                }
            }

            // Close Discord connection
            if (this.isReady()) {
                this.destroy();
            }

            Logger.info('Bot shutdown completed');
            process.exit(0);

        } catch (error) {
            Logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    }

    /**
     * Gets bot statistics
     * @returns {Object} Bot statistics
     */
    getStats() {
        this.stats.uptime = Date.now() - this.stats.startTime;
        return {
            ...this.stats,
            guilds: this.guilds.cache.size,
            users: this.users.cache.size,
            channels: this.channels.cache.size,
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
        };
    }

    /**
     * Updates bot statistics
     * @param {string} stat - Statistic name
     * @param {number} value - Value to add (default: 1)
     */
    updateStats(stat, value = 1) {
        if (this.stats.hasOwnProperty(stat)) {
            this.stats[stat] += value;
        }
    }
}

module.exports = MoosekClient;
