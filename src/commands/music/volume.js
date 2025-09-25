/**
 * @fileoverview Volume command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Adjust the music volume')
        .addIntegerOption(option =>
            option
                .setName('level')
                .setDescription('Volume level (0-1000)')
                .setMinValue(0)
                .setMaxValue(1000)
                .setRequired(true)
        ),

    cooldown: 2,

    /**
     * Executes the volume command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const volume = interaction.options.getInteger('level');
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

            player.setVolume(volume);

            const embed = new EmbedBuilder()
                .setTitle('🔊 Volume Adjusted')
                .setDescription(`Volume has been set to **${volume}%**`)
                .setColor('#000000')
                .setTimestamp();

            if (player.current) {
                embed.addFields({
                    name: '🎵 Currently Playing',
                    value: `**${player.current.info.title}** by ${player.current.info.author}`
                });
            }

            await interaction.reply({ embeds: [embed] });

            Logger.music('volume', interaction.guildId, {
                user: interaction.user.tag,
                volume: volume
            });

        } catch (error) {
            Logger.error('Error in volume command:', error);
            await interaction.reply({
                content: '❌ An error occurred while adjusting the volume.',
                ephemeral: true
            });
        }
    }
};
