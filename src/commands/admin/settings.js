/**
 * @fileoverview Admin Settings command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Administrative commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('settings')
                .setDescription('View current server settings')
        ),

    cooldown: 5,

    /**
     * Executes the admin settings command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            // Check if user has administrator permission
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: '❌ You need Administrator permissions to use this command.',
                    ephemeral: true
                });
            }

            const guildSettings = await client.database.getGuildSettings(interaction.guildId);
            const musicManager = client.musicManager;
            const player = musicManager ? musicManager.getPlayer(interaction.guildId) : null;

            const embed = new EmbedBuilder()
                .setTitle('⚙️ Server Settings')
                .setColor('#000000')
                .setThumbnail(interaction.guild.iconURL())
                .setTimestamp();

            // Basic Settings
            embed.addFields({
                name: '📋 Basic Settings',
                value: `**Auto Play:** ${guildSettings?.auto_play ? 'Enabled' : 'Disabled'}\n**Max Queue Size:** ${guildSettings?.max_queue_size || 100}\n**Command Type:** Slash Commands`,
                inline: true
            });

            // Channel Settings
            const musicChannel = guildSettings?.music_channel_id ? 
                interaction.guild.channels.cache.get(guildSettings.music_channel_id) : null;
            
            embed.addFields({
                name: '📺 Channel Settings',
                value: `**Music Channel:** ${musicChannel ? musicChannel.toString() : 'Not set'}\n**Current Channel:** ${interaction.channel.toString()}`,
                inline: true
            });

            // DJ Settings
            const djRole = guildSettings?.dj_role_id ? 
                interaction.guild.roles.cache.get(guildSettings.dj_role_id) : null;
            
            embed.addFields({
                name: '🎛️ DJ Settings',
                value: `**DJ Role:** ${djRole ? djRole.toString() : 'Not set'}\n**DJ Members:** ${djRole ? djRole.members.size : 'N/A'}`,
                inline: true
            });

            // Music Status
            if (player) {
                embed.addFields({
                    name: '🎵 Music Status',
                    value: `**Playing:** ${player.playing ? 'Yes' : 'No'}\n**Paused:** ${player.paused ? 'Yes' : 'No'}\n**Queue Length:** ${player.queue.length}\n**Volume:** ${player.volume}%`,
                    inline: true
                });
            } else {
                embed.addFields({
                    name: '🎵 Music Status',
                    value: 'No active music player',
                    inline: true
                });
            }

            // Server Info
            embed.addFields({
                name: '📊 Server Info',
                value: `**Members:** ${interaction.guild.memberCount}\n**Channels:** ${interaction.guild.channels.cache.size}\n**Roles:** ${interaction.guild.roles.cache.size}`,
                inline: true
            });

            // Bot Permissions
            const botMember = interaction.guild.members.me;
            const hasVoice = botMember.permissions.has(PermissionFlagsBits.Connect);
            const hasSpeak = botMember.permissions.has(PermissionFlagsBits.Speak);
            const hasManageChannels = botMember.permissions.has(PermissionFlagsBits.ManageChannels);

            embed.addFields({
                name: '🔑 Bot Permissions',
                value: `**Connect to Voice:** ${hasVoice ? '✅' : '❌'}\n**Speak in Voice:** ${hasSpeak ? '✅' : '❌'}\n**Manage Channels:** ${hasManageChannels ? '✅' : '❌'}`,
                inline: true
            });

            await interaction.reply({ embeds: [embed] });

            Logger.command('adminSettings', interaction.user.tag, interaction.guild?.name || 'DM');

        } catch (error) {
            Logger.error('Error in admin settings command:', error);
            await interaction.reply({
                content: '❌ An error occurred while getting server settings.',
                ephemeral: true
            });
        }
    }
};
