/**
 * @fileoverview Ready event for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { Events, ActivityType } = require('discord.js');
const chalk = require('chalk');
const Logger = require('../utils/logger');
const config = require('../config/config');

module.exports = {
    name: Events.ClientReady,
    once: true,

    /**
     * Executes when the client is ready
     * @param {Client} client - The Discord client
     */
    async execute(client) {
        try {
            Logger.startup({
                bot: client.user.tag,
                id: client.user.id,
                guilds: client.guilds.cache.size,
                users: client.users.cache.size,
                channels: client.channels.cache.size
            });

            // Set bot activity
            client.user.setActivity('🎵 Music for everyone', { 
                type: ActivityType.Listening 
            });

            // Initialize music manager
            if (client.musicManager) {
                await client.musicManager.init(client.user.id);
                
                // Load persisted player states if available
                try {
                    await client.musicManager.loadPlayerStates(config.lavalink.options.persistence.filePath);
                    Logger.success('Loaded persisted player states');
                } catch (error) {
                    Logger.warn('No persisted player states found or error loading them');
                }
            }

            // Initialize database
            if (client.database) {
                Logger.success('Database connection established');
            }

            // Set up periodic tasks
            setInterval(() => {
                const guildCount = client.guilds.cache.size;
                const userCount = client.users.cache.size;
                
                // Update activity with stats
                client.user.setActivity(`${guildCount} servers | ${userCount} users`, { 
                    type: ActivityType.Watching 
                });
            }, 300000); // Update every 5 minutes

            Logger.success(`Moosek Music Bot is ready! Logged in as ${client.user.tag}`);
            console.log(chalk.green.bold('╔══════════════════════════════════════╗'));
            console.log(chalk.green.bold('║        MOOSEK MUSIC BOT READY        ║'));
            console.log(chalk.green.bold('╚══════════════════════════════════════╝'));
            console.log(chalk.cyan(`Bot: ${client.user.tag}`));
            console.log(chalk.cyan(`ID: ${client.user.id}`));
            console.log(chalk.cyan(`Guilds: ${client.guilds.cache.size}`));
            console.log(chalk.cyan(`Users: ${client.users.cache.size}`));
            console.log(chalk.cyan(`Channels: ${client.channels.cache.size}`));
            console.log(chalk.yellow('Use slash commands to interact with the bot!'));

        } catch (error) {
            Logger.error('Error in ready event:', error);
        }
    }
};
