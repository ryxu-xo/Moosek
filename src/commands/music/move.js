/**
 * @fileoverview Move command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Move a track to a different position in the queue')
        .addIntegerOption(option =>
            option
                .setName('from')
                .setDescription('Current position of the track (1-based)')
                .setMinValue(1)
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('to')
                .setDescription('New position for the track (1-based)')
                .setMinValue(1)
                .setRequired(true)
        ),

    cooldown: 2,

    /**
     * Executes the move command
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
                    flags: 64
                });
            }

            const from = interaction.options.getInteger('from');
            const to = interaction.options.getInteger('to');
            const musicManager = client.musicManager;
            
            if (!musicManager) {
                return interaction.reply({
                    content: '❌ Music system is not available right now.',
                    flags: 64
                });
            }

            const player = musicManager.getPlayer(interaction.guildId);
            if (!player) {
                return interaction.reply({
                    content: '❌ No music is currently playing in this server.',
                    flags: 64
                });
            }

            if (player.queue.length === 0) {
                return interaction.reply({
                    content: '❌ The queue is empty.',
                    flags: 64
                });
            }

            if (from > player.queue.length) {
                return interaction.reply({
                    content: `❌ Invalid 'from' position. The queue only has ${player.queue.length} tracks.`,
                    flags: 64
                });
            }

            if (to > player.queue.length) {
                return interaction.reply({
                    content: `❌ Invalid 'to' position. The queue only has ${player.queue.length} tracks.`,
                    flags: 64
                });
            }

            if (from === to) {
                return interaction.reply({
                    content: '❌ The track is already at that position.',
                    flags: 64
                });
            }

            // Move track in queue (convert to 0-based index)
            const movedTrack = player.queue.move(from - 1, to - 1);

            const embed = new EmbedBuilder()
                .setTitle('🔄 Track Moved')
                .setDescription(`Moved track from position **${from}** to position **${to}**`)
                .setColor('#000000')
                .setTimestamp();

            if (movedTrack && movedTrack.info) {
                embed.addFields({
                    name: '🎵 Moved Track',
                    value: `**${movedTrack.info.title}** by ${movedTrack.info.author || 'Unknown Artist'}`
                });
            }

            embed.addFields({
                name: '📊 Queue Status',
                value: `**${player.queue.length}** tracks in queue`,
                inline: true
            });

            await interaction.reply({ embeds: [embed] });

            Logger.music('move', interaction.guildId, {
                user: interaction.user.tag,
                from: from,
                to: to,
                movedTrack: movedTrack?.info.title
            });

        } catch (error) {
            Logger.error('Error in move command:', error);
            await interaction.reply({
                content: '❌ An error occurred while moving the track.',
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
