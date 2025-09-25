/**
 * @fileoverview Remove command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a track from the queue')
        .addIntegerOption(option =>
            option
                .setName('position')
                .setDescription('Position of the track to remove (1-based)')
                .setMinValue(1)
                .setRequired(true)
        ),

    cooldown: 2,

    /**
     * Executes the remove command
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

            const position = interaction.options.getInteger('position');
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

            if (player.queue.length === 0) {
                return interaction.reply({
                    content: '❌ The queue is empty.',
                    ephemeral: true
                });
            }

            if (position > player.queue.length) {
                return interaction.reply({
                    content: `❌ Invalid position. The queue only has ${player.queue.length} tracks.`,
                    ephemeral: true
                });
            }

            // Remove track from queue (convert to 0-based index)
            const removedTrack = player.queue.remove(position - 1);

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Track Removed')
                .setDescription(`Removed track at position **${position}**`)
                .setColor('#000000')
                .setTimestamp();

            if (removedTrack) {
                embed.addFields({
                    name: '🎵 Removed Track',
                    value: `**${removedTrack.info.title}** by ${removedTrack.info.author}`
                });
            }

            embed.addFields({
                name: '📊 Queue Status',
                value: `**${player.queue.length}** tracks remaining in queue`,
                inline: true
            });

            await interaction.reply({ embeds: [embed] });

            Logger.music('remove', interaction.guildId, {
                user: interaction.user.tag,
                position: position,
                removedTrack: removedTrack?.info.title
            });

        } catch (error) {
            Logger.error('Error in remove command:', error);
            await interaction.reply({
                content: '❌ An error occurred while removing the track.',
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
