/**
 * @fileoverview Interaction create event for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { Events } = require('discord.js');
const Logger = require('../utils/logger');

module.exports = {
    name: Events.InteractionCreate,

    /**
     * Executes when an interaction is created
     * @param {Interaction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            // Handle slash commands
            if (interaction.isChatInputCommand()) {
                await client.commandHandler.handleCommand(interaction);
                return;
            }

            // Handle button interactions
            if (interaction.isButton()) {
                await handleButtonInteraction(interaction, client);
                return;
            }

            // Handle select menu interactions
            if (interaction.isStringSelectMenu()) {
                await handleSelectMenuInteraction(interaction, client);
                return;
            }

        } catch (error) {
            Logger.error('Error handling interaction:', error);
            
            const errorMessage = {
                content: '❌ An error occurred while processing your interaction.',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};

/**
 * Handles button interactions
 * @param {ButtonInteraction} interaction - The button interaction
 * @param {Client} client - The Discord client
 */
async function handleButtonInteraction(interaction, client) {
    const customId = interaction.customId;
    
    // Handle queue navigation buttons
    if (customId.startsWith('queue_')) {
        const [, action, page] = customId.split('_');
        
        if (action === 'prev' || action === 'next') {
            // Re-run the queue command with the new page
            const queueCommand = client.commandHandler.getCommand('queue');
            if (queueCommand) {
                // Update the interaction options to include all required methods
                interaction.options = {
                    getInteger: (name) => name === 'page' ? parseInt(page) : null,
                    getString: (name) => {
                        if (name === 'filter') return 'all';
                        if (name === 'sort') return 'added';
                        return null;
                    },
                    getBoolean: () => null,
                    getNumber: () => null,
                    getChannel: () => null,
                    getRole: () => null,
                    getMentionable: () => null,
                    getAttachment: () => null,
                    getUser: () => null
                };
                await queueCommand.execute(interaction, client);
            }
        }
    }
}

/**
 * Handles select menu interactions
 * @param {StringSelectMenuInteraction} interaction - The select menu interaction
 * @param {Client} client - The Discord client
 */
async function handleSelectMenuInteraction(interaction, client) {
    const customId = interaction.customId;
    const values = interaction.values;
    
    // Handle music source selection
    if (customId === 'music_source_select') {
        const source = values[0];
        await interaction.reply({
            content: `✅ Music source set to: **${source}**`,
            ephemeral: true
        });
    }
    
    // Handle playlist selection
    if (customId === 'playlist_select') {
        const playlistId = values[0];
        // Handle playlist loading logic here
        await interaction.reply({
            content: `📀 Loading playlist with ID: **${playlistId}**`,
            ephemeral: true
        });
    }
    
    // Handle queue filter selection
    if (customId === 'queue_filter') {
        const filter = values[0];
        const queueCommand = client.commandHandler.getCommand('queue');
        if (queueCommand) {
            // Update the interaction options to include the filter
            interaction.options = {
                getInteger: (name) => name === 'page' ? 1 : null,
                getString: (name) => {
                    if (name === 'filter') return filter;
                    if (name === 'sort') return 'added';
                    return null;
                },
                getBoolean: () => null,
                getNumber: () => null,
                getChannel: () => null,
                getRole: () => null,
                getMentionable: () => null,
                getAttachment: () => null,
                getUser: () => null
            };
            await queueCommand.execute(interaction, client);
        }
    }
    
    // Handle queue sort selection
    if (customId === 'queue_sort') {
        const sort = values[0];
        const queueCommand = client.commandHandler.getCommand('queue');
        if (queueCommand) {
            // Update the interaction options to include the sort
            interaction.options = {
                getInteger: (name) => name === 'page' ? 1 : null,
                getString: (name) => {
                    if (name === 'filter') return 'all';
                    if (name === 'sort') return sort;
                    return null;
                },
                getBoolean: () => null,
                getNumber: () => null,
                getChannel: () => null,
                getRole: () => null,
                getMentionable: () => null,
                getAttachment: () => null,
                getUser: () => null
            };
            await queueCommand.execute(interaction, client);
        }
    }
}
