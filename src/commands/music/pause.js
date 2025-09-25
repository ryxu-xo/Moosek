/**
 * @fileoverview Pause command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the currently playing music'),

    cooldown: 2,

    /**
     * Executes the pause command
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

            if (player.paused) {
                return interaction.reply({
                    content: '⏸️ Music is already paused.',
                    ephemeral: true
                });
            }

            player.pause();

            const embed = new EmbedBuilder()
                .setTitle('⏸️ Music Paused')
                .setDescription('The music has been paused. Use `/resume` to continue playing.')
                .setColor('#000000')
                .setTimestamp();

            if (player.current) {
                embed.addFields({
                    name: '🎵 Currently Paused',
                    value: `**${player.current.info.title}** by ${player.current.info.author}`
                });
            }

            await interaction.reply({ embeds: [embed] });

            Logger.music('pause', interaction.guildId, {
                user: interaction.user.tag,
                track: player.current?.info.title || 'Unknown'
            });

        } catch (error) {
            Logger.error('Error in pause command:', error);
            await interaction.reply({
                content: '❌ An error occurred while pausing the music.',
                ephemeral: true
            });
        }
    }
};
