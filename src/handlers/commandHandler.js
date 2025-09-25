/**
 * @fileoverview Command handler for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { Collection, Events, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const AsciiTable = require('ascii-table');
const Logger = require('../utils/logger');

/**
 * Command handler class that manages slash commands
 */
class CommandHandler {
    /**
     * Creates a new CommandHandler instance
     * @param {Client} client - The Discord client instance
     */
    constructor(client) {
        this.client = client;
        this.commands = new Collection();
        this.cooldowns = new Collection();
        this.commandPath = path.join(__dirname, '../commands');
    }

    /**
     * Loads all commands from the commands directory
     */
    async loadCommands() {
        const table = new AsciiTable()
            .setHeading('Command', 'Status', 'Category')
            .setBorder('│', '─', '┼', '┘');

        try {
            const commandFolders = fs.readdirSync(this.commandPath);
            
            for (const folder of commandFolders) {
                const commandFiles = fs.readdirSync(path.join(this.commandPath, folder))
                    .filter(file => file.endsWith('.js'));

                for (const file of commandFiles) {
                    try {
                        const filePath = path.join(this.commandPath, folder, file);
                        const command = require(filePath);

                        // Validate command structure
                        if (!command.data || !command.execute) {
                            table.addRow(file, chalk.red('❌ Invalid'), folder);
                            Logger.warn(`Command ${file} is missing required properties`);
                            continue;
                        }

                        // Set command category
                        command.category = folder;

                        // Add to collection
                        this.commands.set(command.data.name, command);
                        table.addRow(command.data.name, chalk.green('✓ Loaded'), folder);
                        
                        Logger.debug(`Loaded command: ${command.data.name} from ${folder}/${file}`);
                    } catch (error) {
                        table.addRow(file, chalk.red('❌ Error'), folder);
                        Logger.error(`Error loading command ${file}:`, error);
                    }
                }
            }

            console.log(table.toString());
            Logger.success(`Loaded ${this.commands.size} commands`);
        } catch (error) {
            Logger.error('Error loading commands:', error);
        }
    }

    /**
     * Registers slash commands with Discord
     */
    async registerCommands() {
        try {
            const commands = [];
            
            // Convert commands to Discord API format
            for (const command of this.commands.values()) {
                commands.push(command.data.toJSON());
            }

            const rest = new REST({ version: '10' }).setToken(this.client.token);

            Logger.info('Started refreshing application (/) commands.');

            // Register commands globally or for a specific guild
            const guildId = process.env.GUILD_ID;
            
            // Check if GUILD_ID is a valid snowflake (Discord ID)
            const isValidSnowflake = guildId && /^\d{17,19}$/.test(guildId);
            
            if (isValidSnowflake) {
                // Register for specific guild (faster for development)
                await rest.put(
                    Routes.applicationGuildCommands(this.client.user.id, guildId),
                    { body: commands }
                );
                Logger.success(`Registered ${commands.length} commands for guild ${guildId}`);
            } else {
                // Register globally (takes up to 1 hour to propagate)
                await rest.put(
                    Routes.applicationCommands(this.client.user.id),
                    { body: commands }
                );
                Logger.success(`Registered ${commands.length} commands globally`);
                if (guildId && !isValidSnowflake) {
                    Logger.warn(`Invalid GUILD_ID format: ${guildId}. Using global registration instead.`);
                }
            }

            Logger.info('Successfully reloaded application (/) commands.');
        } catch (error) {
            Logger.error('Error registering commands:', error);
        }
    }

    /**
     * Handles command execution
     * @param {Interaction} interaction - The interaction object
     */
    async handleCommand(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = this.commands.get(interaction.commandName);
        if (!command) {
            Logger.warn(`Unknown command: ${interaction.commandName}`);
            return;
        }

        // Check cooldown
        if (this.isOnCooldown(interaction, command)) {
            const cooldownTime = this.getCooldownTime(interaction, command);
            return interaction.reply({
                content: `⏰ Please wait ${cooldownTime} more second(s) before using this command again.`,
                ephemeral: true
            });
        }

        // Set cooldown
        this.setCooldown(interaction, command);

        try {
            // Check if command is owner-only
            if (command.ownerOnly && interaction.user.id !== this.client.application.ownerId) {
                return interaction.reply({
                    content: '❌ This command is restricted to bot owners only.',
                    flags: 64
                });
            }

            // Log command execution
            Logger.command(
                interaction.commandName,
                interaction.user.tag,
                interaction.guild?.name || 'DM'
            );

            // Execute command
            await command.execute(interaction, this.client);
        } catch (error) {
            Logger.error(`Error executing command ${interaction.commandName}:`, error);
            
            const errorMessage = {
                content: '❌ An error occurred while executing this command!',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }

    /**
     * Checks if a user is on cooldown for a command
     * @param {Interaction} interaction - The interaction object
     * @param {Object} command - The command object
     * @returns {boolean} Whether the user is on cooldown
     */
    isOnCooldown(interaction, command) {
        if (!command.cooldown) return false;

        const { cooldowns } = this;
        const userId = interaction.user.id;
        const commandName = command.data.name;

        if (!cooldowns.has(commandName)) {
            cooldowns.set(commandName, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(commandName);
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (timestamps.has(userId)) {
            const expirationTime = timestamps.get(userId) + cooldownAmount;
            return now < expirationTime;
        }

        return false;
    }

    /**
     * Gets the remaining cooldown time for a command
     * @param {Interaction} interaction - The interaction object
     * @param {Object} command - The command object
     * @returns {number} Remaining cooldown time in seconds
     */
    getCooldownTime(interaction, command) {
        const { cooldowns } = this;
        const userId = interaction.user.id;
        const commandName = command.data.name;
        const timestamps = cooldowns.get(commandName);
        const cooldownAmount = (command.cooldown || 3) * 1000;
        const expirationTime = timestamps.get(userId) + cooldownAmount;
        const timeLeft = (expirationTime - Date.now()) / 1000;

        return Math.ceil(timeLeft);
    }

    /**
     * Sets cooldown for a command
     * @param {Interaction} interaction - The interaction object
     * @param {Object} command - The command object
     */
    setCooldown(interaction, command) {
        if (!command.cooldown) return;

        const { cooldowns } = this;
        const userId = interaction.user.id;
        const commandName = command.data.name;

        if (!cooldowns.has(commandName)) {
            cooldowns.set(commandName, new Collection());
        }

        const timestamps = cooldowns.get(commandName);
        timestamps.set(userId, Date.now());
    }

    /**
     * Gets a command by name
     * @param {string} name - The command name
     * @returns {Object|null} The command object or null if not found
     */
    getCommand(name) {
        return this.commands.get(name) || null;
    }

    /**
     * Gets all commands
     * @returns {Collection} Collection of all commands
     */
    getAllCommands() {
        return this.commands;
    }

    /**
     * Gets commands by category
     * @param {string} category - The category name
     * @returns {Array} Array of commands in the category
     */
    getCommandsByCategory(category) {
        return this.commands.filter(command => command.category === category);
    }
}

module.exports = CommandHandler;
