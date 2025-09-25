/**
 * @fileoverview Advanced search command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } = require('discord.js');
const Logger = require('../../utils/logger');
const { handleTrackAdd } = require('../../events/musicEvents');

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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for music across multiple platforms with advanced filters')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Search query (song name, artist, album, etc.)')
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(200)
        )
        .addStringOption(option =>
            option.setName('platform')
                .setDescription('Preferred platform to search on')
                .setRequired(false)
                .addChoices(
                    { name: '🎵 YouTube', value: 'youtube' },
                    { name: '🎧 Spotify', value: 'spotify' },
                    { name: '🔊 SoundCloud', value: 'soundcloud' },
                    { name: '🌐 All Platforms', value: 'all' }
                )
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of content to search for')
                .setRequired(false)
                .addChoices(
                    { name: '🎵 Tracks Only', value: 'tracks' },
                    { name: '📀 Playlists Only', value: 'playlists' },
                    { name: '🎤 Artists Only', value: 'artists' },
                    { name: '🔍 All Types', value: 'all' }
                )
        )
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of results to show (1-25)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(25)
        ),

    cooldown: 5,

    /**
     * Executes the search command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const query = interaction.options.getString('query');
            const platform = interaction.options.getString('platform') || 'all';
            const type = interaction.options.getString('type') || 'all';
            const limit = interaction.options.getInteger('limit') || 10;

            // Check if user is in a voice channel
            const voiceChannel = interaction.member.voice.channel;
            if (!voiceChannel) {
                return interaction.reply({
                    content: '❌ You must be in a voice channel to use this command!',
                    flags: 64 // Ephemeral flag
                });
            }

            // Check if bot has permission to join and speak in the voice channel
            const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
            if (!permissions.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) {
                return interaction.reply({
                    content: '❌ I don\'t have permission to join or speak in that voice channel!',
                    flags: 64 // Ephemeral flag
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

            // Build search query with filters
            let searchQuery = query;
            if (platform !== 'all') {
                searchQuery = `${platform}:${query}`;
            }

            // Resolve the search query
            const result = await musicManager.resolve({
                query: searchQuery,
                requester: interaction.user,
                source: platform === 'all' ? 'youtube' : platform
            });

            const { loadType, tracks, playlistInfo } = result;

            if (loadType === 'playlist' && tracks && tracks.length > 0) {
                // Handle playlist search result
                const embed = new EmbedBuilder()
                    .setTitle('📀 Playlist Found')
                    .setDescription(`**[${playlistInfo.name}](${query})**`)
                    .setColor('#000000')
                    .addFields(
                        { name: '🎵 Tracks', value: `${tracks.length}`, inline: true },
                        { name: '⏱️ Duration', value: calculatePlaylistDuration(tracks), inline: true },
                        { name: '🔗 Source', value: playlistInfo.source || 'Unknown', inline: true }
                    )
                    .setThumbnail(playlistInfo.thumbnail || client.user.displayAvatarURL())
                    .setFooter({ text: 'Made with ❤️ by ryxu-xo' })
                    .setTimestamp();

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('play_playlist')
                            .setLabel('🎵 Play Playlist')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('shuffle_playlist')
                            .setLabel('🔀 Shuffle & Play')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('cancel_search')
                            .setLabel('❌ Cancel')
                            .setStyle(ButtonStyle.Danger)
                    );

                await interaction.editReply({ 
                    embeds: [embed], 
                    components: [row] 
                });

                // Store playlist data for button interactions
                const collector = interaction.channel.createMessageComponentCollector({
                    filter: i => i.user.id === interaction.user.id,
                    time: 300000 // 5 minutes
                });

                collector.on('collect', async (buttonInteraction) => {
                    if (buttonInteraction.customId === 'play_playlist') {
                        await buttonInteraction.deferUpdate();
                        
                        // Add all tracks to queue
                        for (const track of tracks) {
                            track.info.requester = interaction.user;
                            player.queue.add(track);
                        }

                        // Send playlist notification to channel
                        const playlistEmbed = new EmbedBuilder()
                            .setTitle('📀 Playlist Added to Queue')
                            .setDescription(`**[${playlistInfo.name}](${query})**`)
                            .setColor('#000000')
                            .addFields(
                                { name: '🎵 Tracks', value: `${tracks.length}`, inline: true },
                                { name: '⏱️ Total Duration', value: calculatePlaylistDuration(tracks), inline: true },
                                { name: '📍 Queue Position', value: `${player.queue.length - tracks.length + 1}-${player.queue.length}`, inline: true },
                                { name: '👤 Added by', value: interaction.user.toString(), inline: true },
                                { name: '🎵 Total in Queue', value: `${player.queue.length} tracks`, inline: true }
                            )
                            .setThumbnail(playlistInfo.thumbnail || null)
                            .setFooter({ text: 'Made with ❤️ by ryxu-xo' })
                            .setTimestamp();

                        await interaction.channel.send({ embeds: [playlistEmbed] });

                        await buttonInteraction.editReply({
                            content: '✅ Playlist added to queue!',
                            embeds: [],
                            components: []
                        });

                    } else if (buttonInteraction.customId === 'shuffle_playlist') {
                        await buttonInteraction.deferUpdate();
                        
                        // Shuffle and add tracks to queue
                        const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);
                        for (const track of shuffledTracks) {
                            track.info.requester = interaction.user;
                            player.queue.add(track);
                        }

                        // Send playlist notification to channel
                        const playlistEmbed = new EmbedBuilder()
                            .setTitle('🔀 Shuffled Playlist Added to Queue')
                            .setDescription(`**[${playlistInfo.name}](${query})**`)
                            .setColor('#000000')
                            .addFields(
                                { name: '🎵 Tracks', value: `${tracks.length}`, inline: true },
                                { name: '⏱️ Total Duration', value: calculatePlaylistDuration(tracks), inline: true },
                                { name: '📍 Queue Position', value: `${player.queue.length - tracks.length + 1}-${player.queue.length}`, inline: true },
                                { name: '👤 Added by', value: interaction.user.toString(), inline: true },
                                { name: '🎵 Total in Queue', value: `${player.queue.length} tracks`, inline: true }
                            )
                            .setThumbnail(playlistInfo.thumbnail || null)
                            .setFooter({ text: 'Made with ❤️ by ryxu-xo' })
                            .setTimestamp();

                        await interaction.channel.send({ embeds: [playlistEmbed] });

                        await buttonInteraction.editReply({
                            content: '✅ Shuffled playlist added to queue!',
                            embeds: [],
                            components: []
                        });

                    } else if (buttonInteraction.customId === 'cancel_search') {
                        await buttonInteraction.update({
                            content: '❌ Search cancelled.',
                            embeds: [],
                            components: []
                        });
                    }
                });

                collector.on('end', () => {
                    // Disable buttons after timeout
                    const disabledRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('play_playlist')
                                .setLabel('🎵 Play Playlist')
                                .setStyle(ButtonStyle.Success)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('shuffle_playlist')
                                .setLabel('🔀 Shuffle & Play')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('cancel_search')
                                .setLabel('❌ Cancel')
                                .setStyle(ButtonStyle.Danger)
                                .setDisabled(true)
                        );
                    
                    interaction.editReply({ components: [disabledRow] }).catch(() => {});
                });

            } else if (loadType === 'search' && tracks && tracks.length > 0) {
                // Limit results
                const limitedTracks = tracks.slice(0, limit);
                
                // Create search results embed
                const embed = new EmbedBuilder()
                    .setTitle('🔍 Search Results')
                    .setDescription(`Found **${limitedTracks.length}** result${limitedTracks.length === 1 ? '' : 's'} for **"${query}"**`)
                    .setColor('#000000')
                    .setThumbnail(client.user.displayAvatarURL())
                    .setTimestamp();

                // Add search filters info
                const filters = [];
                if (platform !== 'all') filters.push(`**Platform:** ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
                if (type !== 'all') filters.push(`**Type:** ${type.charAt(0).toUpperCase() + type.slice(1)}`);
                if (filters.length > 0) {
                    embed.addFields({
                        name: '🔧 Search Filters',
                        value: filters.join(' • '),
                        inline: false
                    });
                }

                // Add track results
                const trackList = limitedTracks.map((track, index) => {
                    const duration = track.info.length ? 
                        `${Math.floor(track.info.length / 60000)}:${Math.floor((track.info.length % 60000) / 1000).toString().padStart(2, '0')}` : 
                        'Live';
                    
                    return `**${index + 1}.** [${track.info.title}](${track.info.uri})\n` +
                           `└ 🎤 ${track.info.author || 'Unknown Artist'} • ⏱️ ${duration}`;
                }).join('\n\n');

                embed.addFields({
                    name: '🎵 Results',
                    value: trackList.length > 1024 ? trackList.substring(0, 1020) + '...' : trackList,
                    inline: false
                });

                embed.setFooter({
                    text: 'Made with ❤️ by ryxu-xo • Use buttons below to select tracks',
                    iconURL: client.user.displayAvatarURL()
                });

                // Create selection buttons
                const rows = [];
                const maxButtonsPerRow = 5;
                
                for (let i = 0; i < Math.min(limitedTracks.length, 25); i += maxButtonsPerRow) {
                    const row = new ActionRowBuilder();
                    
                    for (let j = i; j < Math.min(i + maxButtonsPerRow, limitedTracks.length); j++) {
                        const track = limitedTracks[j];
                        const buttonLabel = `${j + 1}`;
                        const buttonDescription = track.info.title.length > 20 ? 
                            track.info.title.substring(0, 17) + '...' : 
                            track.info.title;
                        
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`search_select_${j}`)
                                .setLabel(buttonLabel)
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🎵')
                        );
                    }
                    
                    rows.push(row);
                }

                // Add control buttons
                const controlRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('search_play_all')
                            .setLabel('▶️ Play All')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('search_shuffle')
                            .setLabel('🔀 Shuffle & Play')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('search_cancel')
                            .setLabel('❌ Cancel')
                            .setStyle(ButtonStyle.Danger)
                    );

                rows.push(controlRow);

                const response = await interaction.editReply({ 
                    embeds: [embed], 
                    components: rows 
                });

                // Create collector for button interactions
                const collector = response.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 300000 // 5 minutes
                });

                collector.on('collect', async (buttonInteraction) => {
                    if (buttonInteraction.user.id !== interaction.user.id) {
                        return buttonInteraction.reply({ 
                            content: '❌ Only the command user can use these buttons!', 
                            flags: 64 // Ephemeral flag
                        });
                    }

                    try {
                        const customId = buttonInteraction.customId;

                        if (customId.startsWith('search_select_')) {
                            const trackIndex = parseInt(customId.split('_')[2]);
                            const selectedTrack = limitedTracks[trackIndex];
                            
                            if (selectedTrack) {
                                selectedTrack.info.requester = interaction.user;
                                player.queue.add(selectedTrack);
                                
                                // Send track add notification
                                await handleTrackAdd(player, selectedTrack, client);

                                const successEmbed = new EmbedBuilder()
                                    .setTitle('✅ Track Added to Queue')
                                    .setDescription(`**[${selectedTrack.info.title}](${selectedTrack.info.uri})**`)
                                    .setColor('#000000')
                                    .setThumbnail(selectedTrack.info.thumbnail || selectedTrack.info.artworkUrl || null)
                                    .addFields(
                                        {
                                            name: '🎤 Artist',
                                            value: selectedTrack.info.author || 'Unknown Artist',
                                            inline: true
                                        },
                                        {
                                            name: '⏱️ Duration',
                                            value: selectedTrack.info.length ? 
                                                `${Math.floor(selectedTrack.info.length / 60000)}:${Math.floor((selectedTrack.info.length % 60000) / 1000).toString().padStart(2, '0')}` : 
                                                'Live',
                                            inline: true
                                        },
                                        {
                                            name: '📍 Position in Queue',
                                            value: `${player.queue.length}`,
                                            inline: true
                                        }
                                    )
                                    .setFooter({
                                        text: 'Made with ❤️ by ryxu-xo',
                                        iconURL: client.user.displayAvatarURL()
                                    })
                                    .setTimestamp();

                                await buttonInteraction.reply({ 
                                    embeds: [successEmbed], 
                                    flags: 64 // Ephemeral flag
                                });
                            }
                        } else if (customId === 'search_play_all') {
                            // Add all tracks to queue
                            let addedCount = 0;
                            for (const track of limitedTracks) {
                                track.info.requester = interaction.user;
                                player.queue.add(track);
                                await handleTrackAdd(player, track, client);
                                addedCount++;
                            }

                            const successEmbed = new EmbedBuilder()
                                .setTitle('✅ All Tracks Added to Queue')
                                .setDescription(`**${addedCount} tracks** have been added to the queue!`)
                                .setColor('#000000')
                                .setThumbnail(client.user.displayAvatarURL())
                                .setFooter({
                                    text: 'Made with ❤️ by ryxu-xo',
                                    iconURL: client.user.displayAvatarURL()
                                })
                                .setTimestamp();

                            await buttonInteraction.reply({ 
                                embeds: [successEmbed], 
                                flags: 64 // Ephemeral flag
                            });
                        } else if (customId === 'search_shuffle') {
                            // Shuffle and add all tracks to queue
                            const shuffledTracks = [...limitedTracks].sort(() => Math.random() - 0.5);
                            let addedCount = 0;
                            
                            for (const track of shuffledTracks) {
                                track.info.requester = interaction.user;
                                player.queue.add(track);
                                await handleTrackAdd(player, track, client);
                                addedCount++;
                            }

                            const successEmbed = new EmbedBuilder()
                                .setTitle('🔀 Tracks Shuffled & Added to Queue')
                                .setDescription(`**${addedCount} tracks** have been shuffled and added to the queue!`)
                                .setColor('#000000')
                                .setThumbnail(client.user.displayAvatarURL())
                                .setFooter({
                                    text: 'Made with ❤️ by ryxu-xo',
                                    iconURL: client.user.displayAvatarURL()
                                })
                                .setTimestamp();

                            await buttonInteraction.reply({ 
                                embeds: [successEmbed], 
                                flags: 64 // Ephemeral flag
                            });
                        } else if (customId === 'search_cancel') {
                            const cancelEmbed = new EmbedBuilder()
                                .setTitle('❌ Search Cancelled')
                                .setDescription('Search operation has been cancelled.')
                                .setColor('#ff0000')
                                .setTimestamp();

                            await buttonInteraction.update({ 
                                embeds: [cancelEmbed], 
                                components: [] 
                            });
                            
                            collector.stop();
                        }
                    } catch (error) {
                        Logger.error('Error in search button interaction:', error);
                        await buttonInteraction.reply({ 
                            content: '❌ An error occurred while processing your selection.', 
                            flags: 64 // Ephemeral flag
                        });
                    }
                });

                collector.on('end', () => {
                    // Disable all buttons when collector ends
                    const disabledRows = rows.map(row => {
                        const newRow = new ActionRowBuilder();
                        row.components.forEach(button => {
                            newRow.addComponents(
                                new ButtonBuilder()
                                    .setCustomId(button.data.custom_id)
                                    .setLabel(button.data.label)
                                    .setStyle(button.data.style)
                                    .setEmoji(button.data.emoji)
                                    .setDisabled(true)
                            );
                        });
                        return newRow;
                    });

                    interaction.editReply({ components: disabledRows }).catch(() => {});
                });

            } else {
                const noResultsEmbed = new EmbedBuilder()
                    .setTitle('❌ No Results Found')
                    .setDescription(`No results found for **"${query}"**`)
                    .setColor('#ff0000')
                    .setThumbnail(client.user.displayAvatarURL())
                    .addFields({
                        name: '💡 Search Tips',
                        value: '• Try different keywords\n• Check spelling\n• Use artist names\n• Try song titles\n• Use different platforms',
                        inline: false
                    })
                    .setFooter({
                        text: 'Made with ❤️ by ryxu-xo',
                        iconURL: client.user.displayAvatarURL()
                    })
                    .setTimestamp();

                await interaction.editReply({ embeds: [noResultsEmbed] });
            }

            Logger.command('search', interaction.user.tag, interaction.guild?.name || 'DM', {
                query,
                platform,
                type,
                limit,
                results: tracks?.length || 0
            });

        } catch (error) {
            Logger.error('Error in search command:', error);
            await interaction.reply({
                content: '❌ An error occurred while searching for music.',
                flags: 64 // Ephemeral flag
            });
        }
    }
};
