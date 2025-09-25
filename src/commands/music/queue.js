/**
 * @fileoverview Advanced Queue command for Moosek Music Bot
 * @author ryxu-xo
 * @version 2.0.0
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Display the current music queue with advanced controls')
        .addIntegerOption(option =>
            option
                .setName('page')
                .setDescription('Page number to display (default: 1)')
                .setMinValue(1)
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('filter')
                .setDescription('Filter queue by criteria')
                .setRequired(false)
                .addChoices(
                    { name: '🎵 All Tracks', value: 'all' },
                    { name: '👤 My Tracks', value: 'user' },
                    { name: '⏱️ Short Tracks (< 3min)', value: 'short' },
                    { name: '⏱️ Long Tracks (> 5min)', value: 'long' },
                    { name: '🎧 Live Streams', value: 'live' }
                )
        )
        .addStringOption(option =>
            option
                .setName('sort')
                .setDescription('Sort queue by criteria')
                .setRequired(false)
                .addChoices(
                    { name: '📅 Added Order', value: 'added' },
                    { name: '⏱️ Duration (Short to Long)', value: 'duration_asc' },
                    { name: '⏱️ Duration (Long to Short)', value: 'duration_desc' },
                    { name: '🎤 Artist A-Z', value: 'artist_asc' },
                    { name: '🎵 Title A-Z', value: 'title_asc' }
                )
        ),

    cooldown: 3,

    /**
     * Executes the advanced queue command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const page = interaction.options.getInteger('page') || 1;
            const filter = interaction.options.getString('filter') || 'all';
            const sort = interaction.options.getString('sort') || 'added';
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

            const queue = player.queue;
            const current = player.current;
            const tracksPerPage = 8;
            
            // Apply filters and sorting
            let filteredQueue = applyFilters(queue, filter, interaction.user.id);
            filteredQueue = applySorting(filteredQueue, sort);
            
            const totalPages = Math.ceil(filteredQueue.length / tracksPerPage);

            if (page > totalPages && totalPages > 0) {
                return interaction.reply({
                    content: `❌ Page ${page} does not exist. There are only ${totalPages} page(s).`,
                    flags: 64
                });
            }

            // Create main embed
            const embed = new EmbedBuilder()
                .setTitle('🎵 Advanced Music Queue')
                .setColor('#000000')
                .setThumbnail(current?.info?.thumbnail || null)
                .setTimestamp();

            // Add current track with enhanced info
            if (current) {
                const progressBar = createAdvancedProgressBar(player.position, current.info.length);
                const requester = current.info.requester ? `<@${current.info.requester.id}>` : 'Unknown';
                const source = getSourceEmoji(current.info.sourceName);
                
                const currentTrackValue = `**${current.info.title}**\n` +
                    `🎤 **Artist:** ${current.info.author || 'Unknown'}\n` +
                    `⏱️ **Duration:** ${formatTime(player.position)} / ${formatTime(current.info.length)}\n` +
                    `👤 **Added by:** ${requester}\n` +
                    `🔗 **Source:** ${source} ${current.info.sourceName || 'Unknown'}\n` +
                    `🎵 **URI:** [Click here](${current.info.uri})\n` +
                    `${progressBar}`;

                // Truncate if too long
                const truncatedCurrentTrack = currentTrackValue.length > 1024 
                    ? currentTrackValue.substring(0, 1021) + '...'
                    : currentTrackValue;
                
                embed.addFields({
                    name: '🎵 Now Playing',
                    value: truncatedCurrentTrack,
                    inline: false
                });
            }

            // Add filtered queue information
            if (filteredQueue.length > 0) {
                const startIndex = (page - 1) * tracksPerPage;
                const endIndex = Math.min(startIndex + tracksPerPage, filteredQueue.length);
                const queueTracks = filteredQueue.slice(startIndex, endIndex);

                let queueText = '';
                queueTracks.forEach((track, index) => {
                    const position = startIndex + index + 1;
                    const duration = formatTime(track.info.length);
                    const requester = track.info.requester ? `<@${track.info.requester.id}>` : 'Unknown';
                    const source = getSourceEmoji(track.info.sourceName);
                    const isLive = track.info.stream ? '🔴 LIVE' : '';
                    
                    queueText += `**${position}.** [${track.info.title}](${track.info.uri})\n` +
                                `└ 🎤 ${track.info.author || 'Unknown'} • ⏱️ ${duration} • 👤 ${requester} • ${source} ${track.info.sourceName || 'Unknown'} ${isLive}\n\n`;
                });

                // Truncate queue text if too long
                const maxLength = 1024;
                const truncatedQueueText = queueText && queueText.length > maxLength 
                    ? queueText.substring(0, maxLength - 3) + '...'
                    : queueText || 'No tracks in queue';

                embed.addFields({
                    name: `📋 Queue (${filteredQueue.length}/${queue.length} tracks)`,
                    value: truncatedQueueText,
                    inline: false
                });

                // Add pagination info
                if (totalPages > 1) {
                    embed.setFooter({ 
                        text: `Page ${page} of ${totalPages} • Filter: ${getFilterName(filter)} • Sort: ${getSortName(sort)}`,
                        iconURL: client.user.displayAvatarURL()
                    });
                } else {
                    embed.setFooter({ 
                        text: `Filter: ${getFilterName(filter)} • Sort: ${getSortName(sort)}`,
                        iconURL: client.user.displayAvatarURL()
                    });
                }
            } else {
                embed.addFields({
                    name: '📋 Queue',
                    value: 'No tracks match the current filter',
                    inline: false
                });
            }

            // Add enhanced queue statistics
            const totalDuration = queue.reduce((acc, track) => acc + (track.info.length || 0), 0);
            const currentDuration = current ? (current.info.length || 0) - player.position : 0;
            const remainingDuration = totalDuration + currentDuration;
            const averageDuration = queue.length > 0 ? totalDuration / queue.length : 0;
            
            // Count tracks by source
            const sourceCounts = {};
            queue.forEach(track => {
                const source = track.info.sourceName || 'Unknown';
                sourceCounts[source] = (sourceCounts[source] || 0) + 1;
            });

            const statsValue = `**Total Duration:** ${formatTime(remainingDuration)}\n` +
                `**Tracks in Queue:** ${queue.length}\n` +
                `**Average Duration:** ${formatTime(averageDuration)}\n` +
                `**Loop Mode:** ${player.loopMode || 'None'}\n` +
                `**Volume:** ${player.volume}%\n` +
                `**Shuffle:** ${player.shuffle ? 'Enabled' : 'Disabled'}`;

            // Truncate if too long
            const truncatedStats = statsValue.length > 1024 
                ? statsValue.substring(0, 1021) + '...'
                : statsValue;

            embed.addFields({
                name: '📊 Queue Statistics',
                value: truncatedStats,
                inline: true
            });

            // Add source breakdown
            const sourceBreakdown = Object.entries(sourceCounts)
                .map(([source, count]) => `${getSourceEmoji(source)} ${source}: ${count}`)
                .join('\n');

            if (sourceBreakdown && sourceBreakdown.length <= 1024) {
                embed.addFields({
                    name: '🎧 Sources',
                    value: sourceBreakdown,
                    inline: true
                });
            }

            // Create interactive components
            const components = createQueueComponents(page, totalPages, filter, sort, filteredQueue.length > 0);

            await interaction.reply({ 
                embeds: [embed],
                components: components
            });

            Logger.music('queue', interaction.guildId, {
                user: interaction.user.tag,
                page: page,
                filter: filter,
                sort: sort,
                queueLength: queue.length,
                filteredLength: filteredQueue.length
            });

        } catch (error) {
            Logger.error('Error in queue command:', error);
            await interaction.reply({
                content: '❌ An error occurred while displaying the queue.',
                flags: 64
            });
        }
    }
};

/**
 * Applies filters to the queue
 * @param {Array} queue - The queue array
 * @param {string} filter - Filter type
 * @param {string} userId - User ID for user filter
 * @returns {Array} Filtered queue
 */
function applyFilters(queue, filter, userId) {
    switch (filter) {
        case 'user':
            return queue.filter(track => track.info.requester && track.info.requester.id === userId);
        case 'short':
            return queue.filter(track => track.info.length && track.info.length < 180000); // < 3 minutes
        case 'long':
            return queue.filter(track => track.info.length && track.info.length > 300000); // > 5 minutes
        case 'live':
            return queue.filter(track => track.info.stream);
        case 'all':
        default:
            return [...queue];
    }
}

/**
 * Applies sorting to the queue
 * @param {Array} queue - The queue array
 * @param {string} sort - Sort type
 * @returns {Array} Sorted queue
 */
function applySorting(queue, sort) {
    const sortedQueue = [...queue];
    
    switch (sort) {
        case 'duration_asc':
            return sortedQueue.sort((a, b) => (a.info.length || 0) - (b.info.length || 0));
        case 'duration_desc':
            return sortedQueue.sort((a, b) => (b.info.length || 0) - (a.info.length || 0));
        case 'artist_asc':
            return sortedQueue.sort((a, b) => (a.info.author || '').localeCompare(b.info.author || ''));
        case 'title_asc':
            return sortedQueue.sort((a, b) => (a.info.title || '').localeCompare(b.info.title || ''));
        case 'added':
        default:
            return sortedQueue; // Keep original order
    }
}

/**
 * Gets source emoji for display
 * @param {string} source - Source name
 * @returns {string} Emoji string
 */
function getSourceEmoji(source) {
    const sourceEmojis = {
        'youtube': '📺',
        'youtubemusic': '🎵',
        'spotify': '🎧',
        'soundcloud': '🔊',
        'twitch': '📺',
        'bandcamp': '🎸',
        'vimeo': '🎬'
    };
    return sourceEmojis[source?.toLowerCase()] || '🎵';
}

/**
 * Gets filter display name
 * @param {string} filter - Filter value
 * @returns {string} Display name
 */
function getFilterName(filter) {
    const filterNames = {
        'all': 'All Tracks',
        'user': 'My Tracks',
        'short': 'Short Tracks',
        'long': 'Long Tracks',
        'live': 'Live Streams'
    };
    return filterNames[filter] || 'All Tracks';
}

/**
 * Gets sort display name
 * @param {string} sort - Sort value
 * @returns {string} Display name
 */
function getSortName(sort) {
    const sortNames = {
        'added': 'Added Order',
        'duration_asc': 'Duration (Short to Long)',
        'duration_desc': 'Duration (Long to Short)',
        'artist_asc': 'Artist A-Z',
        'title_asc': 'Title A-Z'
    };
    return sortNames[sort] || 'Added Order';
}

/**
 * Creates interactive components for the queue
 * @param {number} page - Current page
 * @param {number} totalPages - Total pages
 * @param {string} filter - Current filter
 * @param {string} sort - Current sort
 * @param {boolean} hasTracks - Whether there are tracks to display
 * @returns {Array} Array of component rows
 */
function createQueueComponents(page, totalPages, filter, sort, hasTracks) {
    const components = [];
    
    // Navigation buttons
    if (totalPages > 1) {
        const navRow = new ActionRowBuilder();
        
        if (page > 1) {
            navRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`queue_prev_${page - 1}_${filter}_${sort}`)
                    .setLabel('◀ Previous')
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        
        if (page < totalPages) {
            navRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`queue_next_${page + 1}_${filter}_${sort}`)
                    .setLabel('Next ▶')
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`queue_refresh_${page}_${filter}_${sort}`)
                .setLabel('🔄 Refresh')
                .setStyle(ButtonStyle.Primary)
        );
        
        if (navRow.components.length > 0) {
            components.push(navRow);
        }
    }
    
    // Filter and sort dropdowns
    if (hasTracks) {
        const filterRow = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`queue_filter_${page}_${sort}`)
                    .setPlaceholder('🔍 Filter Queue')
                    .addOptions([
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🎵 All Tracks')
                            .setValue('all')
                            .setDefault(filter === 'all'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('👤 My Tracks')
                            .setValue('user')
                            .setDefault(filter === 'user'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('⏱️ Short Tracks (< 3min)')
                            .setValue('short')
                            .setDefault(filter === 'short'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('⏱️ Long Tracks (> 5min)')
                            .setValue('long')
                            .setDefault(filter === 'long'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🎧 Live Streams')
                            .setValue('live')
                            .setDefault(filter === 'live')
                    ])
            );
        
        const sortRow = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`queue_sort_${page}_${filter}`)
                    .setPlaceholder('📊 Sort Queue')
                    .addOptions([
                        new StringSelectMenuOptionBuilder()
                            .setLabel('📅 Added Order')
                            .setValue('added')
                            .setDefault(sort === 'added'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('⏱️ Duration (Short to Long)')
                            .setValue('duration_asc')
                            .setDefault(sort === 'duration_asc'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('⏱️ Duration (Long to Short)')
                            .setValue('duration_desc')
                            .setDefault(sort === 'duration_desc'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🎤 Artist A-Z')
                            .setValue('artist_asc')
                            .setDefault(sort === 'artist_asc'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('🎵 Title A-Z')
                            .setValue('title_asc')
                            .setDefault(sort === 'title_asc')
                    ])
            );
        
        components.push(filterRow, sortRow);
    }
    
    return components;
}

/**
 * Creates an advanced progress bar for the current track
 * @param {number} current - Current position in milliseconds
 * @param {number} total - Total duration in milliseconds
 * @returns {string} Advanced progress bar string
 */
function createAdvancedProgressBar(current, total) {
    if (!total || total === 0) return '';
    
    const progress = Math.round((current / total) * 20);
    const empty = 20 - progress;
    const percentage = Math.round((current / total) * 100);
    
    return `\n\`${'█'.repeat(progress)}${'░'.repeat(empty)}\` ${percentage}%`;
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
