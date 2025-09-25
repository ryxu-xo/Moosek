/**
 * @fileoverview Admin Reset command for Moosek Music Bot
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
                .setName('reset')
                .setDescription('Reset all server settings to default')
        ),

    cooldown: 10,

    /**
     * Executes the admin reset command
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

            const embed = new EmbedBuilder()
                .setTitle('⚠️ Reset Server Settings')
                .setDescription('Are you sure you want to reset all server settings to default? This action cannot be undone.')
                .setColor('#ff0000')
                .setTimestamp();

            embed.addFields({
                name: '🔄 What will be reset:',
                value: '• DJ role settings\n• Music channel settings\n• Auto-play settings\n• Queue size limits\n• All custom configurations',
                inline: false
            });

            embed.addFields({
                name: '⚠️ Warning',
                value: 'This action is **irreversible** and will remove all custom settings for this server.',
                inline: false
            });

            // Reset settings
            await client.database.setGuildSettings(interaction.guildId, {
                music_channel_id: null,
                dj_role_id: null,
                auto_play: true,
                max_queue_size: 100
            });

            // Stop music if playing
            const musicManager = client.musicManager;
            if (musicManager) {
                const player = musicManager.getPlayer(interaction.guildId);
                if (player) {
                    musicManager.destroyPlayer(interaction.guildId);
                }
            }

            embed.setColor('#000000');
            embed.setTitle('✅ Settings Reset');
            embed.setDescription('All server settings have been reset to default values.');

            embed.addFields({
                name: '🔧 Default Settings',
                value: '• **DJ Role:** Not set\n• **Music Channel:** Not set\n• **Auto Play:** Enabled\n• **Max Queue Size:** 100',
                inline: false
            });

            await interaction.reply({ embeds: [embed] });

            Logger.command('adminReset', interaction.guildId, {
                user: interaction.user.tag,
                guild: interaction.guild.name
            });

        } catch (error) {
            Logger.error('Error in admin reset command:', error);
            await interaction.reply({
                content: '❌ An error occurred while resetting server settings.',
                ephemeral: true
            });
        }
    }
};
