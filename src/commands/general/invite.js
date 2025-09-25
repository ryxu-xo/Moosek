/**
 * @fileoverview Invite command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get bot invite link and information'),

    cooldown: 3,

    /**
     * Executes the invite command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=3148800&scope=bot%20applications.commands`;
            const supportUrl = 'https://discord.gg/moosek';
            const githubUrl = 'https://github.com/ryxu-xo/moosek';
            const topggUrl = 'https://top.gg/bot/moosek';

            const embed = new EmbedBuilder()
                .setTitle('🔗 Invite Moosek Music Bot')
                .setDescription('Add Moosek to your server and enjoy high-quality music!')
                .setColor('#000000')
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp();

            embed.addFields(
                {
                    name: '🎵 Features',
                    value: '• High-quality music from multiple sources\n• Advanced queue management\n• Smart DJ role system\n• Voice resilience and auto-recovery\n• SponsorBlock integration\n• Real-time lyrics support',
                    inline: false
                },
                {
                    name: '🔗 Links',
                    value: `[Invite Bot](${inviteUrl})\n[Support Server](${supportUrl})\n[GitHub Repository](${githubUrl})\n[Top.gg Page](${topggUrl})`,
                    inline: false
                },
                {
                    name: '⚙️ Required Permissions',
                    value: '• Send Messages\n• Use Slash Commands\n• Connect to Voice\n• Speak in Voice\n• Embed Links\n• Attach Files',
                    inline: false
                }
            );

            embed.setFooter({
                text: 'Made with ❤️ by ryxu-xo • Official Source Code',
                iconURL: client.user.displayAvatarURL()
            });

            // Create buttons
            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('➕ Invite Bot')
                        .setStyle(ButtonStyle.Link)
                        .setURL(inviteUrl),
                    new ButtonBuilder()
                        .setLabel('🆘 Support Server')
                        .setStyle(ButtonStyle.Link)
                        .setURL(supportUrl),
                    new ButtonBuilder()
                        .setLabel('📁 GitHub')
                        .setStyle(ButtonStyle.Link)
                        .setURL(githubUrl),
                    new ButtonBuilder()
                        .setLabel('⭐ Top.gg')
                        .setStyle(ButtonStyle.Link)
                        .setURL(topggUrl)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('🎵 Help Commands')
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId('invite_help'),
                    new ButtonBuilder()
                        .setLabel('📊 Bot Stats')
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId('invite_stats')
                );

            const response = await interaction.reply({ 
                embeds: [embed], 
                components: [row1, row2] 
            });

            // Create collector for button interactions
            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 300000 // 5 minutes
            });

            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.user.id !== interaction.user.id) {
                    return buttonInteraction.reply({ 
                        content: '❌ Only the command user can use these buttons!', 
                        flags: 64 // Ephemeral flag 
                    });
                }

                try {
                    switch (buttonInteraction.customId) {
                        case 'invite_help':
                            const helpEmbed = new EmbedBuilder()
                                .setTitle('🎵 Quick Help')
                                .setDescription('**Most used commands to get started:**')
                                .setColor('#000000')
                                .setThumbnail(client.user.displayAvatarURL())
                                .addFields({
                                    name: '🎶 Essential Commands',
                                    value: '`/play <song>` - Play music\n`/pause` - Pause music\n`/resume` - Resume music\n`/skip` - Skip track\n`/queue` - View queue\n`/stop` - Stop music',
                                    inline: true
                                })
                                .addFields({
                                    name: '🎧 DJ Commands',
                                    value: '`/dj set <role>` - Set DJ role\n`/dj remove` - Remove DJ role\n`/dj list` - View DJ settings',
                                    inline: true
                                })
                                .setFooter({
                                    text: 'Use /help for complete command list',
                                    iconURL: client.user.displayAvatarURL()
                                })
                                .setTimestamp();

                            await buttonInteraction.reply({ embeds: [helpEmbed], flags: 64 });
                            break;

                        case 'invite_stats':
                            const uptime = process.uptime();
                            const days = Math.floor(uptime / 86400);
                            const hours = Math.floor((uptime % 86400) / 3600);
                            const minutes = Math.floor((uptime % 3600) / 60);

                            const statsEmbed = new EmbedBuilder()
                                .setTitle('📊 Bot Statistics')
                                .setColor('#000000')
                                .setThumbnail(client.user.displayAvatarURL())
                                .addFields({
                                    name: '📈 Server Stats',
                                    value: `**Servers:** \`${client.guilds.cache.size}\`\n**Users:** \`${client.users.cache.size}\`\n**Channels:** \`${client.channels.cache.size}\``,
                                    inline: true
                                })
                                .addFields({
                                    name: '⏰ Uptime & Performance',
                                    value: `**Uptime:** \`${days}d ${hours}h ${minutes}m\`\n**Memory:** \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\`\n**Node.js:** \`${process.version}\``,
                                    inline: true
                                })
                                .addFields({
                                    name: '🎵 Music Stats',
                                    value: `**Active Players:** \`${client.musicManager?.players?.size || 0}\`\n**Total Tracks Played:** \`Coming Soon\`\n**Library:** \`Euralink V4\``,
                                    inline: true
                                })
                                .setFooter({
                                    text: 'Made with ❤️ by ryxu-xo',
                                    iconURL: client.user.displayAvatarURL()
                                })
                                .setTimestamp();

                            await buttonInteraction.reply({ embeds: [statsEmbed], flags: 64 });
                            break;
                    }
                } catch (error) {
                    Logger.error('Error in invite button interaction:', error);
                    await buttonInteraction.reply({ 
                        content: '❌ An error occurred while processing your request.', 
                        flags: 64 // Ephemeral flag 
                    });
                }
            });

            collector.on('end', () => {
                // Disable all buttons when collector ends
                const disabledRow1 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('➕ Invite Bot')
                            .setStyle(ButtonStyle.Link)
                            .setURL(inviteUrl),
                        new ButtonBuilder()
                            .setLabel('🆘 Support Server')
                            .setStyle(ButtonStyle.Link)
                            .setURL(supportUrl),
                        new ButtonBuilder()
                            .setLabel('📁 GitHub')
                            .setStyle(ButtonStyle.Link)
                            .setURL(githubUrl),
                        new ButtonBuilder()
                            .setLabel('⭐ Top.gg')
                            .setStyle(ButtonStyle.Link)
                            .setURL(topggUrl)
                    );

                const disabledRow2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('🎵 Help Commands')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId('invite_help')
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setLabel('📊 Bot Stats')
                            .setStyle(ButtonStyle.Secondary)
                            .setCustomId('invite_stats')
                            .setDisabled(true)
                    );

                interaction.editReply({ components: [disabledRow1, disabledRow2] }).catch(() => {});
            });

            Logger.command('invite', interaction.user.tag, interaction.guild?.name || 'DM');

        } catch (error) {
            Logger.error('Error in invite command:', error);
            await interaction.reply({
                content: '❌ An error occurred while generating the invite link.',
                flags: 64 // Ephemeral flag
            });
        }
    }
};
