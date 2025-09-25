/**
 * @fileoverview Clear command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear the music queue'),

    cooldown: 3,

    /**
     * Executes the clear command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            // Check DJ permissions
            const hasPermission = await checkDJPermissions(interaction, client);
            if (!hasPermission) {
                return interaction.reply({
                    content: '❌ You need DJ permissions to use this command.',
                    ephemeral: true
                });
            }

            const musicManager = client.musicManager;
            
            if (!musicManager) {
                return interaction.reply({
                    content: '❌ Music system is not available right now.',
                    ephemeral: true
                });
            }

            const player = musicManager.getPlayer(interaction.guildId);
            if (!player) {
                return interaction.reply({
                    content: '❌ No music is currently playing in this server.',
                    ephemeral: true
                });
            }

            const queueLength = player.queue.length;
            if (queueLength === 0) {
                return interaction.reply({
                    content: '❌ The queue is already empty.',
                    ephemeral: true
                });
            }

            // Clear the queue
            player.queue.clear();

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Queue Cleared')
                .setDescription(`Successfully cleared **${queueLength}** tracks from the queue`)
                .setColor('#000000')
                .setTimestamp();

            if (player.current) {
                embed.addFields({
                    name: '🎵 Currently Playing',
                    value: `**${player.current.info.title}** by ${player.current.info.author}`
                });
            }

            await interaction.reply({ embeds: [embed] });

            Logger.music('clear', interaction.guildId, {
                user: interaction.user.tag,
                clearedTracks: queueLength
            });

        } catch (error) {
            Logger.error('Error in clear command:', error);
            await interaction.reply({
                content: '❌ An error occurred while clearing the queue.',
                ephemeral: true
            });
        }
    }
};

/**
 * Checks if user has DJ permissions
 * @param {CommandInteraction} interaction - The interaction object
 * @param {Client} client - The Discord client
 * @returns {boolean} Whether user has DJ permissions
 */
async function checkDJPermissions(interaction, client) {
    try {
        // Check if user has administrator permission
        if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return true;
        }

        // Get guild settings from database
        const guildSettings = await client.database.getGuildSettings(interaction.guildId);
        
        if (guildSettings?.dj_role_id) {
            return interaction.member.roles.cache.has(guildSettings.dj_role_id);
        }

        // If no DJ role is set, allow users with Manage Guild permission
        return interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
    } catch (error) {
        Logger.error('Error checking DJ permissions:', error);
        return false;
    }
}
