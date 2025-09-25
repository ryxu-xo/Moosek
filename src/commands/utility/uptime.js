/**
 * @fileoverview Uptime command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Show bot uptime and system information'),

    cooldown: 3,

    /**
     * Executes the uptime command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const uptime = client.uptime;
            const startTime = Date.now() - uptime;
            const musicManager = client.musicManager;
            const systemHealth = musicManager ? musicManager.getSystemHealth() : null;

            const embed = new EmbedBuilder()
                .setTitle('⏱️ Bot Uptime')
                .setColor('#000000')
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp();

            // Uptime Info
            embed.addFields({
                name: '⏰ Uptime',
                value: `**Duration:** ${formatUptime(uptime)}\n**Started:** <t:${Math.floor(startTime / 1000)}:R>\n**Current Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
                inline: true
            });

            // System Info
            const memoryUsage = process.memoryUsage();
            embed.addFields({
                name: '💾 Memory Usage',
                value: `**Heap Used:** ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB\n**Heap Total:** ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB\n**RSS:** ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                inline: true
            });

            // Bot Stats
            const botStats = client.getStats();
            embed.addFields({
                name: '📊 Bot Statistics',
                value: `**Servers:** ${botStats.guilds}\n**Users:** ${botStats.users}\n**Channels:** ${botStats.channels}`,
                inline: true
            });

            // Music Stats
            if (musicManager) {
                const players = musicManager.getAllPlayers();
                embed.addFields({
                    name: '🎵 Music Stats',
                    value: `**Active Players:** ${players.size}\n**Commands Executed:** ${botStats.commandsExecuted}\n**Tracks Played:** ${botStats.tracksPlayed}`,
                    inline: true
                });
            }

            // System Health
            if (systemHealth) {
                embed.addFields({
                    name: '⚡ System Health',
                    value: `**Nodes:** ${systemHealth.connectedNodes}/${systemHealth.totalNodes}\n**Players:** ${systemHealth.totalPlayingPlayers}/${systemHealth.totalPlayers}\n**Avg Ping:** ${Math.round(systemHealth.averagePing)}ms`,
                    inline: true
                });
            }

            // Node.js Info
            embed.addFields({
                name: '🔧 System Info',
                value: `**Node.js:** ${process.version}\n**Platform:** ${process.platform}\n**Architecture:** ${process.arch}`,
                inline: true
            });

            embed.setFooter({
                text: 'Made with ❤️ by ryxu-xo • Official Source Code',
                iconURL: client.user.displayAvatarURL()
            });

            await interaction.reply({ embeds: [embed] });

            Logger.command('uptime', interaction.user.tag, interaction.guild?.name || 'DM');

        } catch (error) {
            Logger.error('Error in uptime command:', error);
            await interaction.reply({
                content: '❌ An error occurred while getting uptime information.',
                ephemeral: true
            });
        }
    }
};

/**
 * Formats uptime from milliseconds to readable format
 * @param {number} ms - Uptime in milliseconds
 * @returns {string} Formatted uptime string
 */
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}
