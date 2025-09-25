/**
 * @fileoverview Shuffle command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the music queue')
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Type of shuffle to perform')
                .setRequired(false)
                .addChoices(
                    { name: 'Normal Shuffle', value: 'normal' },
                    { name: 'Smart Shuffle', value: 'smart' }
                )
        ),

    cooldown: 3,

    /**
     * Executes the shuffle command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const shuffleType = interaction.options.getString('type') || 'normal';
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

            if (player.queue.length === 0) {
                return interaction.reply({
                    content: '❌ The queue is empty. Nothing to shuffle.',
                    ephemeral: true
                });
            }

            if (shuffleType === 'smart') {
                player.queue.smartShuffle(5); // Avoid last 5 tracks
            } else {
                player.queue.shuffle();
            }

            const embed = new EmbedBuilder()
                .setTitle('🔀 Queue Shuffled')
                .setDescription(`Queue has been shuffled using **${shuffleType === 'smart' ? 'Smart' : 'Normal'}** shuffle`)
                .setColor('#000000')
                .setTimestamp();

            embed.addFields({
                name: '📊 Queue Info',
                value: `**${player.queue.length}** tracks in queue`,
                inline: true
            });

            if (player.current) {
                embed.addFields({
                    name: '🎵 Currently Playing',
                    value: `**${player.current.info.title}** by ${player.current.info.author}`,
                    inline: true
                });
            }

            await interaction.reply({ embeds: [embed] });

            Logger.music('shuffle', interaction.guildId, {
                user: interaction.user.tag,
                type: shuffleType,
                queueLength: player.queue.length
            });

        } catch (error) {
            Logger.error('Error in shuffle command:', error);
            await interaction.reply({
                content: '❌ An error occurred while shuffling the queue.',
                ephemeral: true
            });
        }
    }
};
