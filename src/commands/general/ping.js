/**
 * @fileoverview Ping command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency and status'),

    cooldown: 2,

    /**
     * Executes the ping command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const sent = await interaction.reply({ 
                content: '🏓 Pinging...', 
                fetchReply: true 
            });

            const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;
            const websocketLatency = Math.round(client.ws.ping);

            const embed = new EmbedBuilder()
                .setTitle('🏓 Pong!')
                .setColor('#000000')
                .setTimestamp();

            embed.addFields(
                {
                    name: '📡 Roundtrip Latency',
                    value: `${roundtripLatency}ms`,
                    inline: true
                },
                {
                    name: '🌐 WebSocket Latency',
                    value: `${websocketLatency}ms`,
                    inline: true
                },
                {
                    name: '⏱️ Uptime',
                    value: formatUptime(client.uptime),
                    inline: true
                }
            );

            // Add status based on latency
            let status = '🟢 Excellent';
            let statusColor = '#00ff00';
            
            if (roundtripLatency > 200) {
                status = '🟡 Good';
                statusColor = '#ffff00';
            }
            if (roundtripLatency > 500) {
                status = '🟠 Fair';
                statusColor = '#ff8800';
            }
            if (roundtripLatency > 1000) {
                status = '🔴 Poor';
                statusColor = '#ff0000';
            }

            embed.addFields({
                name: '📊 Status',
                value: status,
                inline: true
            });

            embed.setColor(statusColor);

            await interaction.editReply({ 
                content: '',
                embeds: [embed]
            });

            Logger.command('ping', interaction.user.tag, interaction.guild?.name || 'DM');

        } catch (error) {
            Logger.error('Error in ping command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while checking latency.'
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
