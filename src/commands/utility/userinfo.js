/**
 * @fileoverview User Info command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Show information about a user')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to get information about')
                .setRequired(false)
        ),

    cooldown: 3,

    /**
     * Executes the userinfo command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const member = interaction.guild?.members.cache.get(targetUser.id);

            const embed = new EmbedBuilder()
                .setTitle('👤 User Information')
                .setColor('#000000')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .setTimestamp();

            // Basic Info
            embed.addFields({
                name: '📋 Basic Info',
                value: `**Username:** ${targetUser.username}\n**Display Name:** ${targetUser.displayName}\n**ID:** ${targetUser.id}\n**Created:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
                inline: true
            });

            // Bot Info
            if (targetUser.bot) {
                embed.addFields({
                    name: '🤖 Bot Info',
                    value: `**Bot:** Yes\n**Verified:** ${targetUser.verified ? 'Yes' : 'No'}\n**System:** ${targetUser.system ? 'Yes' : 'No'}`,
                    inline: true
                });
            }

            // Member Info (if in guild)
            if (member) {
                embed.addFields({
                    name: '👥 Member Info',
                    value: `**Nickname:** ${member.nickname || 'None'}\n**Joined:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>\n**Roles:** ${member.roles.cache.size - 1}`,
                    inline: true
                });

                // Roles
                const roles = member.roles.cache
                    .filter(role => role.id !== interaction.guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map(role => role.toString())
                    .slice(0, 10);

                if (roles.length > 0) {
                    embed.addFields({
                        name: '🎭 Roles',
                        value: roles.join(', ') + (member.roles.cache.size - 1 > 10 ? ` +${member.roles.cache.size - 11} more` : ''),
                        inline: false
                    });
                }

                // Permissions
                const permissions = member.permissions.toArray();
                const importantPerms = permissions.filter(perm => 
                    ['Administrator', 'ManageGuild', 'ManageChannels', 'ManageRoles', 'ManageMessages'].includes(perm)
                );

                if (importantPerms.length > 0) {
                    embed.addFields({
                        name: '🔑 Key Permissions',
                        value: importantPerms.join(', '),
                        inline: false
                    });
                }
            }

            // Avatar
            embed.addFields({
                name: '🖼️ Avatar',
                value: `[Download Avatar](${targetUser.displayAvatarURL({ dynamic: true, size: 1024 })})`,
                inline: true
            });

            // Status (if member)
            if (member && member.presence) {
                const status = member.presence.status;
                const statusEmojis = {
                    online: '🟢',
                    idle: '🟡',
                    dnd: '🔴',
                    offline: '⚫'
                };

                embed.addFields({
                    name: '📱 Status',
                    value: `${statusEmojis[status]} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    inline: true
                });
            }

            await interaction.reply({ embeds: [embed] });

            Logger.command('userinfo', interaction.user.tag, interaction.guild?.name || 'DM');

        } catch (error) {
            Logger.error('Error in userinfo command:', error);
            await interaction.reply({
                content: '❌ An error occurred while getting user information.',
                ephemeral: true
            });
        }
    }
};
