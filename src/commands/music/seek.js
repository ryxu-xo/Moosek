/**
 * @fileoverview Seek command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Seek to a specific position in the current track')
        .addIntegerOption(option =>
            option
                .setName('position')
                .setDescription('Position in seconds to seek to')
                .setMinValue(0)
                .setRequired(true)
        ),

    cooldown: 2,

    /**
     * Executes the seek command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
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

            if (!player.current) {
                return interaction.reply({
                    content: '❌ No track is currently playing.',
                    ephemeral: true
                });
            }

            const maxPosition = Math.floor(player.current.info.length / 1000);
            if (position > maxPosition) {
                return interaction.reply({
                    content: `❌ Position cannot exceed track duration (${maxPosition} seconds).`,
                    ephemeral: true
                });
            }

            player.seek(position * 1000);

            const embed = new EmbedBuilder()
                .setTitle('⏰ Seeked')
                .setDescription(`Seeked to **${formatTime(position * 1000)}**`)
                .setColor('#000000')
                .setTimestamp();

            if (player.current) {
                embed.addFields({
                    name: '🎵 Current Track',
                    value: `**${player.current.info.title}** by ${player.current.info.author}`,
                    inline: false
                });
                embed.addFields({
                    name: '⏱️ Duration',
                    value: `${formatTime(position * 1000)} / ${formatTime(player.current.info.length)}`,
                    inline: true
                });
            }

            await interaction.reply({ embeds: [embed] });

            Logger.music('seek', interaction.guildId, {
                user: interaction.user.tag,
                position: position,
                track: player.current?.info.title
            });

        } catch (error) {
            Logger.error('Error in seek command:', error);
            await interaction.reply({
                content: '❌ An error occurred while seeking.',
                ephemeral: true
            });
        }
    }
};

/**
 * Formats time from milliseconds to readable format
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatTime(ms) {
    if (!ms || ms === 0) return '0:00';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
}
