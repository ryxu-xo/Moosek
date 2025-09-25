/**
 * @fileoverview Support command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('Get support server link and help information'),

    cooldown: 3,

    /**
     * Executes the support command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const supportUrl = 'https://discord.gg/moosek';
            const githubUrl = 'https://github.com/ryxu-xo/moosek';
            const topggUrl = 'https://top.gg/bot/moosek';

            const embed = new EmbedBuilder()
                .setTitle('🆘 Support & Help')
                .setDescription('Need help with Moosek? We\'re here to assist you!')
                .setColor('#000000')
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp();

            embed.addFields(
                {
                    name: '💬 Support Server',
                    value: `[Join our Discord server](${supportUrl})\nGet help from our community and developers`,
                    inline: false
                },
                {
                    name: '📚 Resources',
                    value: `[GitHub Repository](${githubUrl})\n[Top.gg Page](${topggUrl})\n[Bot Invite](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=3148800&scope=bot%20applications.commands)`,
                    inline: false
                },
                {
                    name: '❓ Common Issues',
                    value: '• **Bot not responding?** Check if slash commands are registered\n• **Music not playing?** Ensure you\'re in a voice channel\n• **Permission errors?** Check bot permissions in your server\n• **Need DJ role?** Use `/dj set <role>` to configure',
                    inline: false
                },
                {
                    name: '🔧 Commands',
                    value: '• `/help` - Show all available commands\n• `/ping` - Check bot latency\n• `/invite` - Get bot invite link\n• `/dj list` - Check DJ settings',
                    inline: false
                }
            );

            embed.setFooter({
                text: 'Made with ❤️ by ryxu-xo • Official Source Code',
                iconURL: client.user.displayAvatarURL()
            });

            await interaction.reply({ embeds: [embed] });

            Logger.command('support', interaction.user.tag, interaction.guild?.name || 'DM');

        } catch (error) {
            Logger.error('Error in support command:', error);
            await interaction.reply({
                content: '❌ An error occurred while getting support information.',
                ephemeral: true
            });
        }
    }
};
