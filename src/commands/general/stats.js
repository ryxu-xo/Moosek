/**
 * @fileoverview Stats command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Show bot statistics and performance metrics'),

    cooldown: 5,

    /**
     * Executes the stats command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const musicManager = client.musicManager;
            const systemHealth = musicManager ? musicManager.getSystemHealth() : null;
            const performanceMetrics = musicManager ? musicManager.getPerformanceMetrics() : null;
            const botStats = client.getStats();

            const embed = new EmbedBuilder()
                .setTitle('📊 Bot Statistics')
                .setColor('#000000')
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp();

            // Bot Statistics
            embed.addFields({
                name: '🤖 Bot Info',
                value: `**Servers:** ${botStats.guilds}\n**Users:** ${botStats.users}\n**Channels:** ${botStats.channels}\n**Uptime:** ${formatUptime(botStats.uptime)}`,
                inline: true
            });

            // System Performance
            if (systemHealth) {
                embed.addFields({
                    name: '⚡ Performance',
                    value: `**Nodes:** ${systemHealth.connectedNodes}/${systemHealth.totalNodes}\n**Players:** ${systemHealth.totalPlayingPlayers}/${systemHealth.totalPlayers}\n**Avg Ping:** ${Math.round(systemHealth.averagePing)}ms`,
                    inline: true
                });
            }

            // Memory Usage
            const memoryUsage = process.memoryUsage();
            embed.addFields({
                name: '💾 Memory Usage',
                value: `**Heap Used:** ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB\n**Heap Total:** ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB\n**External:** ${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
                inline: true
            });

            // Node.js Info
            embed.addFields({
                name: '🔧 System Info',
                value: `**Node.js:** ${botStats.nodeVersion}\n**Platform:** ${botStats.platform}\n**Architecture:** ${process.arch}`,
                inline: true
            });

            // Music Statistics
            if (musicManager) {
                const players = musicManager.getAllPlayers();
                embed.addFields({
                    name: '🎵 Music Stats',
                    value: `**Active Players:** ${players.size}\n**Commands Executed:** ${botStats.commandsExecuted}\n**Tracks Played:** ${botStats.tracksPlayed}`,
                    inline: true
                });
            }

            // Bot Version
            embed.addFields({
                name: '📦 Version Info',
                value: `**Bot Version:** 1.0.0\n**Discord.js:** ${require('discord.js').version}\n**Euralink:** V4`,
                inline: true
            });

            embed.setFooter({
                text: 'Made with ❤️ by ryxu-xo • Official Source Code',
                iconURL: client.user.displayAvatarURL()
            });

            await interaction.reply({ embeds: [embed] });

            Logger.command('stats', interaction.user.tag, interaction.guild?.name || 'DM');

        } catch (error) {
            Logger.error('Error in stats command:', error);
            await interaction.reply({
                content: '❌ An error occurred while getting bot statistics.',
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
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}
