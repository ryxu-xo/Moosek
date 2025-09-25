/**
 * @fileoverview Music manager using Euralink V4 for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { Euralink } = require('ryxu-xo-euralink');
const config = require('../config/config');
const Logger = require('../utils/logger');
const { 
    handleTrackStart, 
    handleTrackEnd, 
    handleTrackError, 
    handleQueueEnd, 
    handleTrackAdd 
} = require('../events/musicEvents');

/**
 * Music manager class that handles all music-related operations
 */
class MusicManager {
    /**
     * Creates a new MusicManager instance
     * @param {Client} client - The Discord client instance
     */
    constructor(client) {
        this.client = client;
        this.euralink = null;
        this.players = new Map();
        this.initializeEuralink();
    }

    /**
     * Initializes the Euralink connection
     */
    initializeEuralink() {
        try {
            this.euralink = new Euralink(this.client, config.lavalink.nodes, {
                send: (data) => {
                    if (!data.d || !data.d.guild_id) {
                        Logger.warn('[Euralink] Invalid data structure, skipping');
                        return;
                    }
                    const guild = this.client.guilds.cache.get(data.d.guild_id);
                    if (guild) {
                        guild.shard.send(data);
                    } else {
                        Logger.warn(`[Euralink] Guild not found: ${data.d.guild_id}`);
                    }
                },
                ...config.lavalink.options
            });

            this.setupEventListeners();
            Logger.success('Euralink V4 initialized successfully');
        } catch (error) {
            Logger.error('Failed to initialize Euralink:', error);
        }
    }

    /**
     * Sets up Euralink event listeners
     */
    setupEventListeners() {
        // Node events
        this.euralink.on('nodeConnect', node => {
            Logger.info(`[Euralink] Connected to node: ${node.name}`);
        });

        this.euralink.on('nodeDisconnect', (node, reason) => {
            Logger.warn(`[Euralink] Node ${node.name} disconnected: ${reason}`);
        });

        this.euralink.on('nodeError', (node, error) => {
            Logger.error(`[Euralink] Node ${node.name} error:`, error);
        });

        // Player events
        this.euralink.on('playerCreate', player => {
            Logger.music('playerCreate', player.guildId);
            this.players.set(player.guildId, player);
        });

        this.euralink.on('playerDestroy', player => {
            Logger.music('playerDestroy', player.guildId);
            this.players.delete(player.guildId);
        });

        this.euralink.on('playerConnect', player => {
            Logger.music('playerConnect', player.guildId);
        });

        this.euralink.on('playerDisconnect', player => {
            Logger.music('playerDisconnect', player.guildId);
        });

        // Track events
        this.euralink.on('trackStart', (player, track) => {
            handleTrackStart(player, track, this.client);
        });

        this.euralink.on('trackEnd', (player, track, reason) => {
            handleTrackEnd(player, track, reason, this.client);
        });

        this.euralink.on('trackError', (player, track, error) => {
            handleTrackError(player, track, error, this.client);
        });

        this.euralink.on('queueEnd', async (player) => {
            await handleQueueEnd(player, this.client);
            
            // Auto-play next track or destroy player
            const autoplay = false; // Can be made configurable
            if (autoplay) {
                try {
                    player.autoplay(player);
                } catch (error) {
                    Logger.error(`[Music] Autoplay failed for guild ${player.guildId}:`, error);
                    player.destroy();
                }
            } else {
                player.destroy();
            }
        });

        // V4 specific events
        this.euralink.on('playerMigrated', (player, oldNode, newNode) => {
            Logger.info(`[Smart Switching] Player ${player.guildId} migrated from ${oldNode.name} to ${newNode.name}`);
        });

        this.euralink.on('playerMigrationFailed', (player, error) => {
            Logger.error(`[Smart Switching] Migration failed for player ${player.guildId}:`, error);
        });

        this.euralink.on('queueLoopToggled', (player, enabled) => {
            Logger.music('queueLoopToggled', player.guildId, { enabled });
        });

        this.euralink.on('queueHistoryCleared', (player) => {
            Logger.music('queueHistoryCleared', player.guildId);
        });

        this.euralink.on('sponsorBlockSegmentsLoaded', (player, segments) => {
            Logger.music('sponsorBlockSegmentsLoaded', player.guildId, { segments: segments.length });
        });

        this.euralink.on('chapterStarted', (player, chapter) => {
            Logger.music('chapterStarted', player.guildId, {
                title: chapter.title,
                startTime: chapter.startTime
            });
        });

        // Player update events
        this.euralink.on('playerUpdate', (player, packet) => {
            // Only log in debug mode to avoid spam
            if (config.lavalink.options.debug) {
                Logger.debug(`[Player Update] Guild: ${player.guildId}`, {
                    playing: packet.state?.playing,
                    position: packet.state?.position,
                    connected: player.connected
                });
            }
        });
    }

    /**
     * Initializes Euralink with the client
     * @param {string} clientId - The Discord client ID
     */
    async init(clientId) {
        try {
            await this.euralink.init(clientId);
            Logger.success('Euralink initialized with client ID');
        } catch (error) {
            Logger.error('Failed to initialize Euralink:', error);
        }
    }

    /**
     * Gets or creates a player for a guild
     * @param {string} guildId - The guild ID
     * @param {Object} options - Player options
     * @returns {Object} The player instance
     */
    getPlayer(guildId, options = {}) {
        let player = this.players.get(guildId);
        
        if (!player) {
            const defaultOptions = {
                guildId,
                voiceChannel: options.voiceChannel,
                textChannel: options.textChannel,
                ...config.music,
                ...options
            };

            player = this.euralink.createConnection(defaultOptions);
            this.players.set(guildId, player);
        } else {
            // Update text channel if provided
            if (options.textChannel) {
                player.textChannel = options.textChannel;
            }
            if (options.voiceChannel) {
                player.voiceChannel = options.voiceChannel;
            }
        }

        return player;
    }

    /**
     * Destroys a player for a guild
     * @param {string} guildId - The guild ID
     */
    destroyPlayer(guildId) {
        const player = this.players.get(guildId);
        if (player) {
            player.destroy();
            this.players.delete(guildId);
        }
    }

    /**
     * Gets all active players
     * @returns {Map} Map of all active players
     */
    getAllPlayers() {
        return this.players;
    }

    /**
     * Gets system health information
     * @returns {Object} System health data
     */
    getSystemHealth() {
        return this.euralink.getSystemHealth();
    }

    /**
     * Gets performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return this.euralink.getPerformanceMetrics();
    }

    /**
     * Saves player states to file
     * @param {string} filePath - Path to save the state file
     */
    async savePlayerStates(filePath) {
        try {
            await this.euralink.savePlayersState(filePath);
            Logger.success('Player states saved successfully');
        } catch (error) {
            Logger.error('Failed to save player states:', error);
        }
    }

    /**
     * Loads player states from file
     * @param {string} filePath - Path to the state file
     */
    async loadPlayerStates(filePath) {
        try {
            await this.euralink.loadPlayersState(filePath);
            Logger.success('Player states loaded successfully');
        } catch (error) {
            Logger.error('Failed to load player states:', error);
        }
    }

    /**
     * Handles voice state updates
     * @param {Object} data - Voice state update data
     */
    updateVoiceState(data) {
        this.euralink.updateVoiceState(data);
    }

    /**
     * Resolves a track or playlist
     * @param {Object} options - Resolve options
     * @returns {Object} Resolved tracks/playlist
     */
    async resolve(options) {
        try {
            return await this.euralink.resolve(options);
        } catch (error) {
            Logger.error('Failed to resolve track:', error);
            throw error;
        }
    }
}

module.exports = MusicManager;
