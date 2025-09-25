/**
 * @fileoverview Music event handlers for professional track notifications
 * @author ryxu-xo
 * @version 1.0.0
 */

const { EmbedBuilder } = require('discord.js');
const Logger = require('../utils/logger');

/**
 * Format duration from milliseconds to readable format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
    if (!ms || ms === 0) return 'Live';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
}

/**
 * Get track thumbnail URL using Euralink's built-in system
 * @param {Object} track - Track object
 * @returns {string} Thumbnail URL
 */
function getTrackThumbnail(track) {
    // Use Euralink's built-in thumbnail system which handles all sources automatically
    return track.info.thumbnail || null;
}

/**
 * Handle track start event
 * @param {Object} player - Euralink player
 * @param {Object} track - Track object
 * @param {Object} client - Discord client
 */
async function handleTrackStart(player, track, client) {
    try {
        const guild = client.guilds.cache.get(player.guildId);
        if (!guild) return;

        // Get the text channel where the music command was used
        const textChannelId = player.textChannel || player.textChannelId;
        Logger.debug(`Looking for text channel: ${textChannelId} in guild ${player.guildId}`);
        const channel = guild.channels.cache.get(textChannelId);
        if (!channel) {
            Logger.warn(`Text channel not found: ${textChannelId} in guild ${player.guildId}`);
            Logger.debug(`Available channels: ${guild.channels.cache.map(c => `${c.id}:${c.name}`).join(', ')}`);
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('🎵 Now Playing')
            .setDescription(`**[${track.info.title}](${track.info.uri})**`)
            .setColor('#000000') // Black theme to match bot PFP
            .setThumbnail(getTrackThumbnail(track))
            .addFields(
                {
                    name: '🎤 Artist',
                    value: track.info.author || 'Unknown Artist',
                    inline: true
                },
                {
                    name: '⏱️ Duration',
                    value: formatDuration(track.info.length),
                    inline: true
                },
                {
                    name: '🔊 Volume',
                    value: `${player.volume}%`,
                    inline: true
                },
                {
                    name: '🎵 Queue Size',
                    value: `${player.queue.length} tracks`,
                    inline: true
                },
                {
                    name: '🔄 Loop Mode',
                    value: player.loopMode || 'None',
                    inline: true
                }
            )
            .setFooter({
                text: 'Made with ❤️ by ryxu-xo',
                iconURL: client.user.displayAvatarURL()
            })
            .setTimestamp();

        // Add queue position if there are more tracks
        if (player.queue.length > 0) {
            embed.addFields({
                name: '📋 Queue',
                value: `${player.queue.length} track${player.queue.length === 1 ? '' : 's'} remaining`,
                inline: false
            });
        }

        await channel.send({ embeds: [embed] });

        Logger.music('trackStart', player.guildId, {
            title: track.info.title,
            author: track.info.author,
            duration: track.info.length
        });
    } catch (error) {
        Logger.error('Error in trackStart event:', error);
    }
}

/**
 * Handle track end event
 * @param {Object} player - Euralink player
 * @param {Object} track - Track object
 * @param {string} reason - Reason for track end
 * @param {Object} client - Discord client
 */
async function handleTrackEnd(player, track, reason, client) {
    try {
        const guild = client.guilds.cache.get(player.guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(player.textChannel || player.textChannelId);
        if (!channel) {
            Logger.warn(`Text channel not found: ${player.textChannel || player.textChannelId} in guild ${player.guildId}`);
            return;
        }

        // Only send message for certain reasons
        if (reason === 'FINISHED' || reason === 'STOPPED') {
            const embed = new EmbedBuilder()
                .setTitle('✅ Track Finished')
                .setDescription(`**[${track.info.title}](${track.info.uri})**`)
                .setColor('#000000')
                .setThumbnail(getTrackThumbnail(track))
                .addFields(
                    {
                        name: '🎤 Artist',
                        value: track.info.author || 'Unknown Artist',
                        inline: true
                    },
                    {
                        name: '⏱️ Duration',
                        value: formatDuration(track.info.length),
                        inline: true
                    },
                    {
                        name: '📋 Status',
                        value: reason === 'FINISHED' ? 'Completed' : 'Stopped',
                        inline: true
                    }
                )
                .setFooter({
                    text: 'Made with ❤️ by ryxu-xo',
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        }

        Logger.music('trackEnd', player.guildId, {
            title: track.info.title,
            reason: reason
        });
    } catch (error) {
        Logger.error('Error in trackEnd event:', error);
    }
}

/**
 * Handle track error event
 * @param {Object} player - Euralink player
 * @param {Object} track - Track object
 * @param {Error} error - Error object
 * @param {Object} client - Discord client
 */
async function handleTrackError(player, track, error, client) {
    try {
        const guild = client.guilds.cache.get(player.guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(player.textChannel || player.textChannelId);
        if (!channel) {
            Logger.warn(`Text channel not found: ${player.textChannel || player.textChannelId} in guild ${player.guildId}`);
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('❌ Track Error')
            .setDescription(`**[${track.info.title}](${track.info.uri})**`)
            .setColor('#ff0000')
            .setThumbnail(getTrackThumbnail(track))
            .addFields(
                {
                    name: '🎤 Artist',
                    value: track.info.author || 'Unknown Artist',
                    inline: true
                },
                {
                    name: '⚠️ Error',
                    value: error.message || 'Unknown error occurred',
                    inline: true
                },
                {
                    name: '🔄 Action',
                    value: 'Skipping to next track...',
                    inline: true
                }
            )
            .setFooter({
                text: 'Made with ❤️ by ryxu-xo',
                iconURL: client.user.displayAvatarURL()
            })
            .setTimestamp();

        await channel.send({ embeds: [embed] });

        Logger.error(`[Music] Track error in guild ${player.guildId}:`, error);
    } catch (error) {
        Logger.error('Error in trackError event:', error);
    }
}

/**
 * Handle queue end event
 * @param {Object} player - Euralink player
 * @param {Object} client - Discord client
 */
async function handleQueueEnd(player, client) {
    try {
        const guild = client.guilds.cache.get(player.guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(player.textChannel || player.textChannelId);
        if (!channel) {
            Logger.warn(`Text channel not found: ${player.textChannel || player.textChannelId} in guild ${player.guildId}`);
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('🏁 Queue Finished')
            .setDescription('All tracks in the queue have been played!')
            .setColor('#000000')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                {
                    name: '🎵 What\'s Next?',
                    value: '• Use `/play <song>` to add more music\n• Use `/queue` to check the queue\n• Use `/help` to see all commands',
                    inline: false
                }
            )
            .setFooter({
                text: 'Made with ❤️ by ryxu-xo',
                iconURL: client.user.displayAvatarURL()
            })
            .setTimestamp();

        await channel.send({ embeds: [embed] });

        Logger.music('queueEnd', player.guildId);
    } catch (error) {
        Logger.error('Error in queueEnd event:', error);
    }
}

/**
 * Handle track added to queue event
 * @param {Object} player - Euralink player
 * @param {Object} track - Track object
 * @param {Object} client - Discord client
 */
async function handleTrackAdd(player, track, client) {
    try {
        const guild = client.guilds.cache.get(player.guildId);
        if (!guild) {
            Logger.warn(`Guild not found: ${player.guildId}`);
            return;
        }

        const textChannelId = player.textChannel || player.textChannelId;
        Logger.debug(`[TrackAdd] Looking for text channel: ${textChannelId} in guild ${player.guildId}`);
        const channel = guild.channels.cache.get(textChannelId);
        if (!channel) {
            Logger.warn(`[TrackAdd] Text channel not found: ${textChannelId} in guild ${player.guildId}`);
            Logger.debug(`[TrackAdd] Available channels: ${guild.channels.cache.map(c => `${c.id}:${c.name}`).join(', ')}`);
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('➕ Track Added to Queue')
            .setDescription(`**[${track.info.title}](${track.info.uri})**`)
            .setColor('#000000') // Black theme to match bot PFP
            .setThumbnail(getTrackThumbnail(track))
            .addFields(
                {
                    name: '🎤 Artist',
                    value: track.info.author || 'Unknown Artist',
                    inline: true
                },
                {
                    name: '⏱️ Duration',
                    value: formatDuration(track.info.length),
                    inline: true
                },
                {
                    name: '📍 Queue Position',
                    value: `${player.queue.length}`,
                    inline: true
                },
                {
                    name: '🎵 Total in Queue',
                    value: `${player.queue.length + (player.isPlaying ? 1 : 0)} tracks`,
                    inline: true
                },
                {
                    name: '⏳ Estimated Wait',
                    value: calculateWaitTime(player),
                    inline: true
                }
            )
            .setFooter({
                text: 'Made with ❤️ by ryxu-xo',
                iconURL: client.user.displayAvatarURL()
            })
            .setTimestamp();

        await channel.send({ embeds: [embed] });

        Logger.music('trackAdd', player.guildId, {
            title: track.info.title,
            author: track.info.author,
            position: player.queue.length
        });
    } catch (error) {
        Logger.error('Error in trackAdd event:', error);
    }
}

/**
 * Calculates estimated wait time for a track in queue
 * @param {Object} player - Euralink player
 * @returns {string} Formatted wait time
 */
function calculateWaitTime(player) {
    if (!player.isPlaying && player.queue.length === 0) {
        return 'Starting now';
    }
    
    let totalTime = 0;
    
    // Add remaining time of current track
    if (player.isPlaying && player.position && player.track) {
        const remaining = (player.track.info.length - player.position) / 1000;
        totalTime += remaining;
    }
    
    // Add time for all queued tracks
    for (const track of player.queue) {
        totalTime += (track.info.length || 0) / 1000;
    }
    
    if (totalTime < 60) {
        return `${Math.round(totalTime)}s`;
    } else if (totalTime < 3600) {
        return `${Math.round(totalTime / 60)}m`;
    } else {
        const hours = Math.floor(totalTime / 3600);
        const minutes = Math.round((totalTime % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
}

module.exports = {
    handleTrackStart,
    handleTrackEnd,
    handleTrackError,
    handleQueueEnd,
    handleTrackAdd
};
