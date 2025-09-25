/**
 * @fileoverview Stop command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the music and clear the queue'),

    cooldown: 3,

    /**
     * Executes the stop command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
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
            const currentTrack = player.current?.info.title;

            // Destroy the player (this stops music and clears queue)
            musicManager.destroyPlayer(interaction.guildId);

            const embed = new EmbedBuilder()
                .setTitle('⏹️ Music Stopped')
                .setDescription('The music has been stopped and the queue has been cleared.')
                .setColor('#000000')
                .setTimestamp();

            if (currentTrack) {
                embed.addFields({
                    name: '🎵 Stopped Track',
                    value: `**${currentTrack}**`
                });
            }

            if (queueLength > 0) {
                embed.addFields({
                    name: '🗑️ Cleared Queue',
                    value: `${queueLength} track(s) removed from queue`
                });
            }

            await interaction.reply({ embeds: [embed] });

            Logger.music('stop', interaction.guildId, {
                user: interaction.user.tag,
                stoppedTrack: currentTrack,
                clearedTracks: queueLength
            });

        } catch (error) {
            Logger.error('Error in stop command:', error);
            await interaction.reply({
                content: '❌ An error occurred while stopping the music.',
                ephemeral: true
            });
        }
    }
};
