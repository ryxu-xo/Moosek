/**
 * @fileoverview Skip command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the currently playing track')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Number of tracks to skip (default: 1)')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
        ),

    cooldown: 2,

    /**
     * Executes the skip command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const amount = interaction.options.getInteger('amount') || 1;
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

            if (player.queue.length === 0 && amount > 1) {
                return interaction.reply({
                    content: `❌ There are not enough tracks in the queue to skip ${amount} tracks.`,
                    ephemeral: true
                });
            }

            const currentTrack = player.current;
            const skippedTracks = [];

            // Skip the specified amount of tracks
            for (let i = 0; i < amount; i++) {
                if (player.current) {
                    skippedTracks.push(player.current.info.title);
                }
                player.skip();
            }

            const embed = new EmbedBuilder()
                .setTitle('⏭️ Track Skipped')
                .setColor('#000000')
                .setTimestamp();

            if (amount === 1) {
                embed.setDescription(`Skipped: **${skippedTracks[0] || 'Unknown track'}**`);
            } else {
                embed.setDescription(`Skipped ${amount} tracks:`);
                embed.addFields({
                    name: '🎵 Skipped Tracks',
                    value: skippedTracks.map((track, index) => `${index + 1}. ${track}`).join('\n') || 'Unknown tracks'
                });
            }

            // Show next track if available
            if (player.current) {
                embed.addFields({
                    name: '🎵 Now Playing',
                    value: `**${player.current.info.title}** by ${player.current.info.author}`
                });
            } else if (player.queue.length > 0) {
                const nextTrack = player.queue[0];
                embed.addFields({
                    name: '⏭️ Next Up',
                    value: `**${nextTrack.info.title}** by ${nextTrack.info.author}`
                });
            }

            await interaction.reply({ embeds: [embed] });

            Logger.music('skip', interaction.guildId, {
                user: interaction.user.tag,
                amount: amount,
                skippedTracks: skippedTracks
            });

        } catch (error) {
            Logger.error('Error in skip command:', error);
            await interaction.reply({
                content: '❌ An error occurred while skipping the track(s).',
                ephemeral: true
            });
        }
    }
};
