/**
 * @fileoverview Now Playing command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show information about the currently playing track'),

    cooldown: 2,

    /**
     * Executes the nowplaying command
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

            if (!player.current) {
                return interaction.reply({
                    content: '❌ No track is currently playing.',
                    ephemeral: true
                });
            }

            const track = player.current;
            const progressBar = createProgressBar(player.position, track.info.length);
            const duration = formatTime(track.info.length);
            const current = formatTime(player.position);
            const remaining = formatTime(track.info.length - player.position);

            const embed = new EmbedBuilder()
                .setTitle('🎵 Now Playing')
                .setDescription(`**[${track.info.title}](${track.info.uri})**`)
                .setColor('#000000')
                .setThumbnail(track.info.artworkUrl || null)
                .setTimestamp();

            embed.addFields(
                {
                    name: '🎤 Artist',
                    value: track.info.author,
                    inline: true
                },
                {
                    name: '⏱️ Duration',
                    value: `${current} / ${duration}`,
                    inline: true
                },
                {
                    name: '⏰ Remaining',
                    value: remaining,
                    inline: true
                },
                {
                    name: '🔊 Volume',
                    value: `${player.volume}%`,
                    inline: true
                },
                {
                    name: '🔁 Loop Mode',
                    value: player.loop || 'None',
                    inline: true
                },
                {
                    name: '📍 Queue Position',
                    value: `${player.queue.length} tracks`,
                    inline: true
                },
                {
                    name: '📊 Progress',
                    value: progressBar,
                    inline: false
                }
            );

            if (track.info.requester) {
                embed.addFields({
                    name: '👤 Requested by',
                    value: track.info.requester.toString(),
                    inline: true
                });
            }

            await interaction.reply({ embeds: [embed] });

            Logger.music('nowplaying', interaction.guildId, {
                user: interaction.user.tag,
                track: track.info.title
            });

        } catch (error) {
            Logger.error('Error in nowplaying command:', error);
            await interaction.reply({
                content: '❌ An error occurred while getting track information.',
                ephemeral: true
            });
        }
    }
};

/**
 * Creates a progress bar for the current track
 * @param {number} current - Current position in milliseconds
 * @param {number} total - Total duration in milliseconds
 * @returns {string} Progress bar string
 */
function createProgressBar(current, total) {
    if (!current || !total || total === 0) return '░'.repeat(20);
    
    const progress = Math.round((current / total) * 20);
    const empty = 20 - progress;
    
    return `\`${'█'.repeat(progress)}${'░'.repeat(empty)}\``;
}

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
