/**
 * @fileoverview Lyrics command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Get lyrics for the currently playing track'),

    cooldown: 5,

    /**
     * Executes the lyrics command
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

            await interaction.deferReply();

            try {
                const lyricsResult = await player.getLyrics();
                
                if (lyricsResult.error) {
                    return interaction.editReply({
                        content: `❌ ${lyricsResult.error}`
                    });
                }

                const lyrics = lyricsResult.lyrics || lyricsResult.syncedLyrics;
                
                if (!lyrics) {
                    return interaction.editReply({
                        content: '❌ No lyrics found for this track.'
                    });
                }

                // Split lyrics if too long
                const maxLength = 4096;
                const lyricsChunks = [];
                let currentChunk = '';

                if (lyrics.length <= maxLength) {
                    lyricsChunks.push(lyrics);
                } else {
                    const lines = lyrics.split('\n');
                    for (const line of lines) {
                        if (currentChunk.length + line.length + 1 > maxLength) {
                            lyricsChunks.push(currentChunk.trim());
                            currentChunk = line;
                        } else {
                            currentChunk += (currentChunk ? '\n' : '') + line;
                        }
                    }
                    if (currentChunk.trim()) {
                        lyricsChunks.push(currentChunk.trim());
                    }
                }

                const embed = new EmbedBuilder()
                    .setTitle('🎤 Lyrics')
                    .setDescription(`**${player.current.info.title}** by ${player.current.info.author}`)
                    .setColor('#000000')
                    .setTimestamp();

                if (lyricsChunks.length === 1) {
                    embed.addFields({
                        name: '📝 Lyrics',
                        value: lyricsChunks[0]
                    });
                } else {
                    embed.addFields({
                        name: '📝 Lyrics (Part 1)',
                        value: lyricsChunks[0]
                    });
                }

                await interaction.editReply({ embeds: [embed] });

                // Send additional chunks if needed
                for (let i = 1; i < lyricsChunks.length; i++) {
                    const additionalEmbed = new EmbedBuilder()
                        .setTitle('🎤 Lyrics (Continued)')
                        .setDescription(`**${player.current.info.title}** by ${player.current.info.author}`)
                        .addFields({
                            name: `📝 Lyrics (Part ${i + 1})`,
                            value: lyricsChunks[i]
                        })
                        .setColor('#000000')
                        .setTimestamp();

                    await interaction.followUp({ embeds: [additionalEmbed] });
                }

                Logger.music('lyrics', interaction.guildId, {
                    user: interaction.user.tag,
                    track: player.current.info.title
                });

            } catch (error) {
                Logger.error('Error fetching lyrics:', error);
                await interaction.editReply({
                    content: '❌ Failed to fetch lyrics for this track.'
                });
            }

        } catch (error) {
            Logger.error('Error in lyrics command:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching lyrics.',
                ephemeral: true
            });
        }
    }
};
