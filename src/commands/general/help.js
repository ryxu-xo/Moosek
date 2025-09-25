/**
 * @fileoverview Interactive help command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands and bot information'),

    cooldown: 3,

    /**
     * Executes the help command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            // Create main help embed
            const mainEmbed = new EmbedBuilder()
                .setTitle('🎵 Moosek Music Bot')
                .setDescription('**Your ultimate Discord music experience powered by Euralink V4!**\n\n' +
                    '✨ **High-quality audio streaming**\n' +
                    '🎧 **Advanced DJ controls**\n' +
                    '🔧 **Comprehensive utility tools**\n' +
                    '⚡ **Lightning-fast performance**')
                .setColor('#000000')
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp();

            // Bot Information
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);

            mainEmbed.addFields({
                name: '🤖 Bot Information',
                value: `**Version:** \`1.0.0\`\n**Author:** \`ryxu-xo\`\n**Library:** \`Discord.js v14\`\n**Music Engine:** \`Euralink V4\`\n**Node.js:** \`${process.version}\``,
                inline: true
            });

            // Quick Stats
            mainEmbed.addFields({
                name: '📊 Statistics',
                value: `**Servers:** \`${client.guilds.cache.size}\`\n**Users:** \`${client.users.cache.size}\`\n**Uptime:** \`${days}d ${hours}h ${minutes}m\`\n**Memory:** \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\``,
                inline: true
            });

            // Links
            mainEmbed.addFields({
                name: '🔗 Links',
                value: '[**GitHub**](https://github.com/ryxu-xo/moosek) • [**Invite Bot**](https://discord.com/api/oauth2/authorize?client_id=\`${client.user.id}\`&permissions=8&scope=bot%20applications.commands) • [**Support Server**](https://discord.gg/YOUR_SUPPORT_SERVER) • [**Top.gg**](https://top.gg/bot/YOUR_BOT_ID)',
                inline: false
            });

            // Footer
            mainEmbed.setFooter({
                text: 'Made with ❤️ by ryxu-xo • Official Source Code • Use buttons below to explore commands',
                iconURL: client.user.displayAvatarURL()
            });

            // Create dropdown menu
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_select')
                .setPlaceholder('Choose a category to explore...')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('🎵 Music Commands')
                        .setDescription('All music-related commands')
                        .setValue('music'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('🎧 DJ Commands')
                        .setDescription('DJ role management commands')
                        .setValue('dj'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('ℹ️ General Commands')
                        .setDescription('Basic bot information and utility')
                        .setValue('general'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('🔧 Utility Commands')
                        .setDescription('Server and user information')
                        .setValue('utility'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('👑 Admin Commands')
                        .setDescription('Server administration commands')
                        .setValue('admin')
                );

            const row1 = new ActionRowBuilder()
                .addComponents(selectMenu);

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('🆘 Support')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.gg/YOUR_SUPPORT_SERVER'),
                    new ButtonBuilder()
                        .setLabel('➕ Invite')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=8&scope=bot%20applications.commands'),
                    new ButtonBuilder()
                        .setLabel('📁 GitHub')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://github.com/ryxu-xo/moosek')
                );

            const response = await interaction.reply({ 
                embeds: [mainEmbed], 
                components: [row1, row2] 
            });

            // Create collector for select menu interactions
            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 300000 // 5 minutes
            });

            collector.on('collect', async (selectInteraction) => {
                if (selectInteraction.user.id !== interaction.user.id) {
                    return selectInteraction.reply({ 
                        content: '❌ Only the command user can use this menu!', 
                        flags: 64 // Ephemeral flag
                    });
                }

                try {
                    const selectedValue = selectInteraction.values[0];
                    let embed;
                    let newSelectMenu;

                    switch (selectedValue) {
                        case 'home':
                            embed = mainEmbed;
                            newSelectMenu = createSelectMenu(['music', 'dj', 'general', 'utility', 'admin'], 'home');
                            break;
                        case 'music':
                            embed = createMusicHelpEmbed(client);
                            newSelectMenu = createSelectMenu(['dj', 'general', 'utility', 'admin'], 'music');
                            break;
                        case 'dj':
                            embed = createDJHelpEmbed(client);
                            newSelectMenu = createSelectMenu(['music', 'general', 'utility', 'admin'], 'dj');
                            break;
                        case 'general':
                            embed = createGeneralHelpEmbed(client);
                            newSelectMenu = createSelectMenu(['music', 'dj', 'utility', 'admin'], 'general');
                            break;
                        case 'utility':
                            embed = createUtilityHelpEmbed(client);
                            newSelectMenu = createSelectMenu(['music', 'dj', 'general', 'admin'], 'utility');
                            break;
                        case 'admin':
                            embed = createAdminHelpEmbed(client);
                            newSelectMenu = createSelectMenu(['music', 'dj', 'general', 'utility'], 'admin');
                            break;
                        default:
                            return;
                    }

                    const newRow1 = new ActionRowBuilder().addComponents(newSelectMenu);
                    const newRow2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('🆘 Support')
                                .setStyle(ButtonStyle.Link)
                                .setURL('https://discord.gg/YOUR_SUPPORT_SERVER'),
                            new ButtonBuilder()
                                .setLabel('➕ Invite')
                                .setStyle(ButtonStyle.Link)
                                .setURL('https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=8&scope=bot%20applications.commands'),
                            new ButtonBuilder()
                                .setLabel('📁 GitHub')
                                .setStyle(ButtonStyle.Link)
                                .setURL('https://github.com/ryxu-xo/moosek')
                        );

                    await selectInteraction.update({ embeds: [embed], components: [newRow1, newRow2] });
                } catch (error) {
                    Logger.error('Error in help select interaction:', error);
                    await selectInteraction.reply({ 
                        content: '❌ An error occurred while processing your request.', 
                        flags: 64 // Ephemeral flag
                    });
                }
            });

            collector.on('end', () => {
                // Disable select menu when collector ends
                const disabledSelectMenu = new StringSelectMenuBuilder()
                    .setCustomId('help_select')
                    .setPlaceholder('Help menu expired - Use /help again')
                    .setDisabled(true)
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Help menu expired')
                            .setDescription('Use /help command again')
                            .setValue('expired')
                    );

                const disabledRow1 = new ActionRowBuilder()
                    .addComponents(disabledSelectMenu);

                const disabledRow2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('🆘 Support')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://discord.gg/YOUR_SUPPORT_SERVER'),
                        new ButtonBuilder()
                            .setLabel('➕ Invite')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=8&scope=bot%20applications.commands'),
                        new ButtonBuilder()
                            .setLabel('📁 GitHub')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://github.com/ryxu-xo/moosek')
                    );

                interaction.editReply({ components: [disabledRow1, disabledRow2] }).catch(() => {});
            });

            Logger.command('help', interaction.user.tag, interaction.guild?.name || 'DM');

        } catch (error) {
            Logger.error('Error in help command:', error);
            await interaction.reply({
                content: '❌ An error occurred while displaying help.',
                flags: 64 // Ephemeral flag
            });
        }
    }
};

/**
 * Create music commands help embed
 * @param {Object} client - The Discord client
 * @returns {EmbedBuilder} Music help embed
 */
function createMusicHelpEmbed(client) {
    const embed = new EmbedBuilder()
        .setTitle('🎵 Music Commands')
        .setDescription('**All music-related commands for the ultimate listening experience**')
        .setColor('#000000')
        .setThumbnail(client.user.displayAvatarURL())
        .setTimestamp();

     embed.addFields({
         name: '🎶 Playback Controls',
         value: '`/play <query>` - Play music from YouTube, Spotify, etc.\n' +
                '`/search <query>` - Advanced music search with filters\n' +
                '`/pause` - Pause the current track\n' +
                '`/resume` - Resume the paused track\n' +
                '`/stop` - Stop playback and clear queue\n' +
                '`/skip` - Skip to the next track',
         inline: true
     });

    embed.addFields({
        name: '📋 Queue Management',
        value: '`/queue` - Show the music queue\n' +
               '`/clear` - Clear the music queue\n' +
               '`/remove <position>` - Remove a track from queue\n' +
               '`/move <from> <to>` - Move a track in the queue\n' +
               '`/shuffle` - Shuffle the music queue',
        inline: true
    });

    embed.addFields({
        name: '🎛️ Audio Controls',
        value: '`/volume <1-100>` - Adjust playback volume\n' +
               '`/seek <time>` - Seek to a position in the track\n' +
               '`/loop <mode>` - Set loop mode (none/track/queue)\n' +
               '`/nowplaying` - Show current track info\n' +
               '`/lyrics` - Get lyrics for current track',
        inline: true
    });

    embed.setFooter({
        text: 'Made with ❤️ by ryxu-xo • Use dropdown to navigate',
        iconURL: client.user.displayAvatarURL()
    });

    return embed;
}

/**
 * Create a dynamic select menu with Home option and excluding selected category
 * @param {Array} availableCategories - Array of available category values
 * @param {string} currentCategory - Currently selected category (to exclude)
 * @returns {StringSelectMenuBuilder} Dynamic select menu
 */
function createSelectMenu(availableCategories, currentCategory) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help_select')
        .setPlaceholder('Choose a category to explore...');

    // Add Home option first
    selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('🏠 Home')
            .setDescription('Return to main help page')
            .setValue('home')
    );

    // Add available categories (excluding current one)
    const categoryMap = {
        'music': { label: '🎵 Music Commands', description: 'All music-related commands' },
        'dj': { label: '🎧 DJ Commands', description: 'DJ role management commands' },
        'general': { label: 'ℹ️ General Commands', description: 'Basic bot information and utility' },
        'utility': { label: '🔧 Utility Commands', description: 'Server and user information' },
        'admin': { label: '👑 Admin Commands', description: 'Server administration commands' }
    };

    availableCategories.forEach(category => {
        if (category !== currentCategory) {
            selectMenu.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(categoryMap[category].label)
                    .setDescription(categoryMap[category].description)
                    .setValue(category)
            );
        }
    });

    return selectMenu;
}

/**
 * Create DJ commands help embed
 * @param {Object} client - The Discord client
 * @returns {EmbedBuilder} DJ help embed
 */
function createDJHelpEmbed(client) {
    const embed = new EmbedBuilder()
        .setTitle('🎧 DJ Commands')
        .setDescription('**Manage DJ roles and permissions for your server**')
        .setColor('#000000')
        .setThumbnail(client.user.displayAvatarURL())
        .setTimestamp();

    embed.addFields({
        name: '👑 DJ Role Management',
        value: '`/dj set <role>` - Set DJ role for the server\n' +
               '`/dj remove` - Remove DJ role\n' +
               '`/dj list` - List current DJ settings',
        inline: false
    });

    embed.addFields({
        name: 'ℹ️ DJ Permissions',
        value: 'Users with the DJ role can:\n' +
               '• Control music playback\n' +
               '• Manage the music queue\n' +
               '• Adjust audio settings\n' +
               '• Skip tracks even if not the requester',
        inline: false
    });

    embed.setFooter({
        text: 'Made with ❤️ by ryxu-xo • Use dropdown to navigate',
        iconURL: client.user.displayAvatarURL()
    });

    return embed;
}

/**
 * Create a dynamic select menu with Home option and excluding selected category
 * @param {Array} availableCategories - Array of available category values
 * @param {string} currentCategory - Currently selected category (to exclude)
 * @returns {StringSelectMenuBuilder} Dynamic select menu
 */
function createSelectMenu(availableCategories, currentCategory) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help_select')
        .setPlaceholder('Choose a category to explore...');

    // Add Home option first
    selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('🏠 Home')
            .setDescription('Return to main help page')
            .setValue('home')
    );

    // Add available categories (excluding current one)
    const categoryMap = {
        'music': { label: '🎵 Music Commands', description: 'All music-related commands' },
        'dj': { label: '🎧 DJ Commands', description: 'DJ role management commands' },
        'general': { label: 'ℹ️ General Commands', description: 'Basic bot information and utility' },
        'utility': { label: '🔧 Utility Commands', description: 'Server and user information' },
        'admin': { label: '👑 Admin Commands', description: 'Server administration commands' }
    };

    availableCategories.forEach(category => {
        if (category !== currentCategory) {
            selectMenu.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(categoryMap[category].label)
                    .setDescription(categoryMap[category].description)
                    .setValue(category)
            );
        }
    });

    return selectMenu;
}

/**
 * Create general commands help embed
 * @param {Object} client - The Discord client
 * @returns {EmbedBuilder} General help embed
 */
function createGeneralHelpEmbed(client) {
    const embed = new EmbedBuilder()
        .setTitle('ℹ️ General Commands')
        .setDescription('**Basic bot information and utility commands**')
        .setColor('#000000')
        .setThumbnail(client.user.displayAvatarURL())
        .setTimestamp();

    embed.addFields({
        name: '📊 Bot Information',
        value: '`/help` - Show this help message\n' +
               '`/ping` - Check bot latency\n' +
               '`/stats` - Show bot statistics\n' +
               '`/uptime` - Show bot uptime\n' +
               '`/version` - Show bot version info',
        inline: true
    });

    embed.addFields({
        name: '🔗 Links & Support',
        value: '`/invite` - Get bot invite link\n' +
               '`/support` - Get support server link',
        inline: true
    });

    embed.setFooter({
        text: 'Made with ❤️ by ryxu-xo • Use dropdown to navigate',
        iconURL: client.user.displayAvatarURL()
    });

    return embed;
}

/**
 * Create a dynamic select menu with Home option and excluding selected category
 * @param {Array} availableCategories - Array of available category values
 * @param {string} currentCategory - Currently selected category (to exclude)
 * @returns {StringSelectMenuBuilder} Dynamic select menu
 */
function createSelectMenu(availableCategories, currentCategory) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help_select')
        .setPlaceholder('Choose a category to explore...');

    // Add Home option first
    selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('🏠 Home')
            .setDescription('Return to main help page')
            .setValue('home')
    );

    // Add available categories (excluding current one)
    const categoryMap = {
        'music': { label: '🎵 Music Commands', description: 'All music-related commands' },
        'dj': { label: '🎧 DJ Commands', description: 'DJ role management commands' },
        'general': { label: 'ℹ️ General Commands', description: 'Basic bot information and utility' },
        'utility': { label: '🔧 Utility Commands', description: 'Server and user information' },
        'admin': { label: '👑 Admin Commands', description: 'Server administration commands' }
    };

    availableCategories.forEach(category => {
        if (category !== currentCategory) {
            selectMenu.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(categoryMap[category].label)
                    .setDescription(categoryMap[category].description)
                    .setValue(category)
            );
        }
    });

    return selectMenu;
}

/**
 * Create utility commands help embed
 * @param {Object} client - The Discord client
 * @returns {EmbedBuilder} Utility help embed
 */
function createUtilityHelpEmbed(client) {
    const embed = new EmbedBuilder()
        .setTitle('🔧 Utility Commands')
        .setDescription('**Server and user information commands**')
        .setColor('#000000')
        .setThumbnail(client.user.displayAvatarURL())
        .setTimestamp();

    embed.addFields({
        name: '🏠 Server Information',
        value: '`/serverinfo` - Show server information\n' +
               '`/userinfo [user]` - Show user information\n' +
               '`/avatar [user]` - Get user avatar',
        inline: true
    });

    embed.addFields({
        name: '⏰ Time & Status',
        value: '`/uptime` - Show bot uptime\n' +
               '`/version` - Show bot version info',
        inline: true
    });

    embed.setFooter({
        text: 'Made with ❤️ by ryxu-xo • Use dropdown to navigate',
        iconURL: client.user.displayAvatarURL()
    });

    return embed;
}

/**
 * Create a dynamic select menu with Home option and excluding selected category
 * @param {Array} availableCategories - Array of available category values
 * @param {string} currentCategory - Currently selected category (to exclude)
 * @returns {StringSelectMenuBuilder} Dynamic select menu
 */
function createSelectMenu(availableCategories, currentCategory) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help_select')
        .setPlaceholder('Choose a category to explore...');

    // Add Home option first
    selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('🏠 Home')
            .setDescription('Return to main help page')
            .setValue('home')
    );

    // Add available categories (excluding current one)
    const categoryMap = {
        'music': { label: '🎵 Music Commands', description: 'All music-related commands' },
        'dj': { label: '🎧 DJ Commands', description: 'DJ role management commands' },
        'general': { label: 'ℹ️ General Commands', description: 'Basic bot information and utility' },
        'utility': { label: '🔧 Utility Commands', description: 'Server and user information' },
        'admin': { label: '👑 Admin Commands', description: 'Server administration commands' }
    };

    availableCategories.forEach(category => {
        if (category !== currentCategory) {
            selectMenu.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(categoryMap[category].label)
                    .setDescription(categoryMap[category].description)
                    .setValue(category)
            );
        }
    });

    return selectMenu;
}

/**
 * Create admin commands help embed
 * @param {Object} client - The Discord client
 * @returns {EmbedBuilder} Admin help embed
 */
function createAdminHelpEmbed(client) {
    const embed = new EmbedBuilder()
        .setTitle('👑 Admin Commands')
        .setDescription('**Server administration and configuration commands**')
        .setColor('#000000')
        .setThumbnail(client.user.displayAvatarURL())
        .setTimestamp();

    embed.addFields({
        name: '⚙️ Server Settings',
        value: '`/admin settings` - View server settings\n' +
               '`/admin reset` - Reset server settings to default',
        inline: false
    });

    embed.addFields({
        name: '🔧 Developer Tools',
        value: '`/eval <code>` - Execute JavaScript code (Owner only)\n' +
               '• Execute code with full bot context\n' +
               '• Supports async/await operations\n' +
               '• Silent execution option available',
        inline: false
    });

    embed.addFields({
        name: '⚠️ Important Notes',
        value: '• Admin commands require **Administrator** permission\n' +
               '• Settings are server-specific\n' +
               '• Reset command cannot be undone\n' +
               '• DJ role can be configured via `/dj set`',
        inline: false
    });

    embed.setFooter({
        text: 'Made with ❤️ by ryxu-xo • Use dropdown to navigate',
        iconURL: client.user.displayAvatarURL()
    });

    return embed;
}

/**
 * Create a dynamic select menu with Home option and excluding selected category
 * @param {Array} availableCategories - Array of available category values
 * @param {string} currentCategory - Currently selected category (to exclude)
 * @returns {StringSelectMenuBuilder} Dynamic select menu
 */
function createSelectMenu(availableCategories, currentCategory) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help_select')
        .setPlaceholder('Choose a category to explore...');

    // Add Home option first
    selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('🏠 Home')
            .setDescription('Return to main help page')
            .setValue('home')
    );

    // Add available categories (excluding current one)
    const categoryMap = {
        'music': { label: '🎵 Music Commands', description: 'All music-related commands' },
        'dj': { label: '🎧 DJ Commands', description: 'DJ role management commands' },
        'general': { label: 'ℹ️ General Commands', description: 'Basic bot information and utility' },
        'utility': { label: '🔧 Utility Commands', description: 'Server and user information' },
        'admin': { label: '👑 Admin Commands', description: 'Server administration commands' }
    };

    availableCategories.forEach(category => {
        if (category !== currentCategory) {
            selectMenu.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(categoryMap[category].label)
                    .setDescription(categoryMap[category].description)
                    .setValue(category)
            );
        }
    });

    return selectMenu;
}