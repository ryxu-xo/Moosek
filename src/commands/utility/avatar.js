/**
 * @fileoverview Avatar command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Get a user\'s avatar')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to get avatar from')
                .setRequired(false)
        ),

    cooldown: 2,

    /**
     * Executes the avatar command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const member = interaction.guild?.members.cache.get(targetUser.id);

            const embed = new EmbedBuilder()
                .setTitle(`🖼️ ${targetUser.username}'s Avatar`)
                .setColor('#000000')
                .setImage(targetUser.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setTimestamp();

            // Avatar Info
            embed.addFields({
                name: '📋 Avatar Info',
                value: `**User:** ${targetUser.tag}\n**ID:** ${targetUser.id}\n**Animated:** ${targetUser.avatar ? (targetUser.avatar.startsWith('a_') ? 'Yes' : 'No') : 'No'}`,
                inline: true
            });

            // Avatar URLs
            const avatarUrl = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });
            const pngUrl = targetUser.displayAvatarURL({ extension: 'png', size: 1024 });
            const jpgUrl = targetUser.displayAvatarURL({ extension: 'jpg', size: 1024 });
            const webpUrl = targetUser.displayAvatarURL({ extension: 'webp', size: 1024 });

            embed.addFields({
                name: '🔗 Download Links',
                value: `[PNG](${pngUrl}) • [JPG](${jpgUrl}) • [WEBP](${webpUrl})${targetUser.avatar && targetUser.avatar.startsWith('a_') ? ` • [GIF](${avatarUrl})` : ''}`,
                inline: false
            });

            // Server Avatar (if different)
            if (member && member.avatar) {
                embed.addFields({
                    name: '🎭 Server Avatar',
                    value: `This user has a custom server avatar!`,
                    inline: false
                });
            }

            await interaction.reply({ embeds: [embed] });

            Logger.command('avatar', interaction.user.tag, interaction.guild?.name || 'DM');

        } catch (error) {
            Logger.error('Error in avatar command:', error);
            await interaction.reply({
                content: '❌ An error occurred while getting the avatar.',
                ephemeral: true
            });
        }
    }
};
