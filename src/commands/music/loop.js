/**
 * @fileoverview Loop command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Set the loop mode for music playback')
        .addStringOption(option =>
            option
                .setName('mode')
                .setDescription('Loop mode to set')
                .setRequired(true)
                .addChoices(
                    { name: 'None', value: 'none' },
                    { name: 'Track', value: 'track' },
                    { name: 'Queue', value: 'queue' }
                )
        ),

    cooldown: 2,

    /**
     * Executes the loop command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const mode = interaction.options.getString('mode');
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

            player.setLoop(mode);

            const modeEmojis = {
                'none': '❌',
                'track': '🔁',
                'queue': '🔂'
            };

            const modeNames = {
                'none': 'None',
                'track': 'Track',
                'queue': 'Queue'
            };

            const embed = new EmbedBuilder()
                .setTitle('🔁 Loop Mode Changed')
                .setDescription(`Loop mode has been set to **${modeEmojis[mode]} ${modeNames[mode]}**`)
                .setColor('#000000')
                .setTimestamp();

            if (player.current) {
                embed.addFields({
                    name: '🎵 Currently Playing',
                    value: `**${player.current.info.title}** by ${player.current.info.author}`
                });
            }

            await interaction.reply({ embeds: [embed] });

            Logger.music('loop', interaction.guildId, {
                user: interaction.user.tag,
                mode: mode
            });

        } catch (error) {
            Logger.error('Error in loop command:', error);
            await interaction.reply({
                content: '❌ An error occurred while setting the loop mode.',
                ephemeral: true
            });
        }
    }
};
