/**
 * @fileoverview Version command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('version')
        .setDescription('Show bot version and dependency information'),

    cooldown: 3,

    /**
     * Executes the version command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const packageJson = require('../../package.json');
            const discordJsVersion = require('discord.js').version;

            const embed = new EmbedBuilder()
                .setTitle('📦 Version Information')
                .setColor('#000000')
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp();

            // Bot Version
            embed.addFields({
                name: '🤖 Bot Version',
                value: `**Moosek Music Bot:** ${packageJson.version}\n**Node.js:** ${process.version}\n**Platform:** ${process.platform}`,
                inline: true
            });

            // Core Dependencies
            embed.addFields({
                name: '📚 Core Dependencies',
                value: `**Discord.js:** ${discordJsVersion}\n**Euralink:** V4\n**SQLite3:** ${packageJson.dependencies.sqlite3}`,
                inline: true
            });

            // Additional Dependencies
            embed.addFields({
                name: '🔧 Additional Dependencies',
                value: `**Winston:** ${packageJson.dependencies.winston}\n**Chalk:** ${packageJson.dependencies.chalk}\n**Dotenv:** ${packageJson.dependencies.dotenv}`,
                inline: true
            });

            // Bot Info
            embed.addFields({
                name: 'ℹ️ Bot Information',
                value: `**Author:** ${packageJson.author}\n**License:** ${packageJson.license}\n**Repository:** [GitHub](${packageJson.repository.url})`,
                inline: true
            });

            // Features
            embed.addFields({
                name: '✨ Features',
                value: '• Euralink V4 Integration\n• Smart Node Switching\n• Voice Resilience\n• SponsorBlock Support\n• Real-time Lyrics\n• Advanced Queue Management',
                inline: false
            });

            // Links
            embed.addFields({
                name: '🔗 Links',
                value: `[GitHub Repository](${packageJson.repository.url})\n[Support Server](https://discord.gg/moosek)\n[Top.gg Page](https://top.gg/bot/moosek)`,
                inline: false
            });

            embed.setFooter({
                text: 'Made with ❤️ by ryxu-xo • Official Source Code',
                iconURL: client.user.displayAvatarURL()
            });

            await interaction.reply({ embeds: [embed] });

            Logger.command('version', interaction.user.tag, interaction.guild?.name || 'DM');

        } catch (error) {
            Logger.error('Error in version command:', error);
            await interaction.reply({
                content: '❌ An error occurred while getting version information.',
                ephemeral: true
            });
        }
    }
};
