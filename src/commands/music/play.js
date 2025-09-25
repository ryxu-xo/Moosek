/**
 * @fileoverview Play command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Logger = require('../../utils/logger');
const { handleTrackAdd } = require('../../events/musicEvents');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play music from YouTube, Spotify, or other sources')
        .addStringOption(option =>
            option
                .setName('query')
                .setDescription('Song name, artist, or URL to play')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('source')
                .setDescription('Music source to search from')
                .setRequired(false)
                .addChoices(
                    { name: 'YouTube Music', value: 'ytmsearch' },
                    { name: 'YouTube', value: 'ytsearch' },
                    { name: 'SoundCloud', value: 'scsearch' },
                    { name: 'Spotify', value: 'spsearch' }
                )
        ),

    cooldown: 3,

    /**
     * Executes the play command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const query = interaction.options.getString('query');
            const source = interaction.options.getString('source') || 'ytmsearch';
            const member = interaction.member;
            const voiceChannel = member.voice?.channel;

            // Check if user is in a voice channel
            if (!voiceChannel) {
                return interaction.reply({
                    content: '❌ You must be in a voice channel to use this command!',
                    ephemeral: true
                });
            }

            // Check if bot has permission to join and speak in the voice channel
            const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
            if (!permissions.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) {
                return interaction.reply({
                    content: '❌ I don\'t have permission to join or speak in that voice channel!',
                    ephemeral: true
                });
            }

            // Defer reply as this might take a moment
            await interaction.deferReply();

            // Get music manager
            const musicManager = client.musicManager;
            if (!musicManager) {
                return interaction.editReply({
                    content: '❌ Music system is not available right now. Please try again later.'
                });
            }

            // Get or create player
            const player = musicManager.getPlayer(interaction.guildId, {
                voiceChannel: voiceChannel.id,
                textChannel: interaction.channelId
            });

            // Resolve the query
            const result = await musicManager.resolve({
                query: query,
                requester: interaction.user,
                source: source
            });

            const { loadType, tracks, playlistInfo } = result;

            if (loadType === 'playlist') {
                // Handle playlist
                for (const track of tracks) {
                    track.info.requester = interaction.user;
                    player.queue.add(track);
                    // Don't send individual track add notifications for playlists
                }

                // Send playlist notification to channel
                const guild = client.guilds.cache.get(interaction.guildId);
                if (guild) {
                    const channel = guild.channels.cache.get(interaction.channelId);
                    if (channel) {
                        const playlistEmbed = new EmbedBuilder()
                            .setTitle('📀 Playlist Added to Queue')
                            .setDescription(`**[${playlistInfo.name}](${query})**`)
                            .setColor('#000000') // Black theme to match bot PFP
                            .addFields(
                                { name: '🎵 Tracks', value: `${tracks.length}`, inline: true },
                                { name: '⏱️ Total Duration', value: calculatePlaylistDuration(tracks), inline: true },
                                { name: '📍 Queue Position', value: `${player.queue.length - tracks.length + 1}-${player.queue.length}`, inline: true },
                                { name: '👤 Added by', value: interaction.user.toString(), inline: true },
                                { name: '🎵 Total in Queue', value: `${player.queue.length} tracks`, inline: true },
                                { name: '⏳ Estimated Wait', value: calculatePlaylistWaitTime(player, tracks.length), inline: true }
                            )
                            .setThumbnail(playlistInfo.thumbnail || null)
                            .setFooter({ text: 'Made with ❤️ by ryxu-xo' })
                            .setTimestamp();

                        await channel.send({ embeds: [playlistEmbed] });
                    }
                }

                const embed = new EmbedBuilder()
                    .setTitle('📀 Playlist Added Successfully')
                    .setDescription(`**${playlistInfo.name}**`)
                    .addFields(
                        { name: '🎵 Tracks', value: `${tracks.length}`, inline: true },
                        { name: '⏱️ Duration', value: calculatePlaylistDuration(tracks), inline: true },
                        { name: '👤 Added by', value: interaction.user.toString(), inline: true }
                    )
                    .setColor('#000000')
                    .setThumbnail(playlistInfo.thumbnail || null)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } else if (loadType === 'search' || loadType === 'track') {
                // Handle single track
                const track = tracks[0];
                track.info.requester = interaction.user;
                player.queue.add(track);
                
                // Send track add notification
                await handleTrackAdd(player, track, client);

                // Simple confirmation message (removed duplicate - track add notification handles this)
                await interaction.editReply({
                content: `✅ Track added to queue!`
                });
            } else {
                return interaction.editReply({
                    content: '❌ No results found for your search query.'
                });
            }

            // Start playing if not already playing
            if (!player.playing && !player.paused) {
                try {
                    await player.play();
                    Logger.music('playbackStarted', interaction.guildId, {
                        user: interaction.user.tag,
                        query: query
                    });
                } catch (error) {
                    Logger.error('Error starting playback:', error);
                    await interaction.followUp({
                        content: '❌ Error starting playback. Please try again.',
                        ephemeral: true
                    });
                }
            }

        } catch (error) {
            Logger.error('Error in play command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while processing your request. Please try again.'
            });
        }
    }
};

/**
 * Formats duration from milliseconds to readable format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
function formatDuration(ms) {
    if (!ms || ms === 0) return 'Unknown';
    
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
 * Calculates total duration from tracks array
 * @param {Array} tracks - Array of track objects
 * @returns {string} Formatted duration string
 */
function calculatePlaylistDuration(tracks) {
    if (!tracks || tracks.length === 0) return 'Unknown';
    
    let totalMs = 0;
    for (const track of tracks) {
        if (track.info && track.info.length) {
            totalMs += track.info.length;
        }
    }
    
    return formatDuration(totalMs);
}

/**
 * Calculates estimated wait time for a playlist
 * @param {Object} player - Euralink player
 * @param {number} playlistLength - Number of tracks in playlist
 * @returns {string} Formatted wait time
 */
function calculatePlaylistWaitTime(player, playlistLength) {
    if (!player.isPlaying && player.queue.length === 0) {
        return 'Starting now';
    }
    
    let totalTime = 0;
    
    // Add remaining time of current track
    if (player.isPlaying && player.position && player.track) {
        const remaining = (player.track.info.length - player.position) / 1000;
        totalTime += remaining;
    }
    
    // Add time for all queued tracks (excluding the playlist we just added)
    const tracksBeforePlaylist = player.queue.length - playlistLength;
    for (let i = 0; i < tracksBeforePlaylist; i++) {
        const track = player.queue[i];
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
