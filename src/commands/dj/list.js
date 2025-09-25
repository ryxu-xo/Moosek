/**
 * @fileoverview DJ List command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dj')
        .setDescription('DJ role management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List current DJ settings for this server')
        ),

    cooldown: 3,

    /**
     * Executes the dj list command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const musicManager = client.musicManager;
            
            if (!musicManager) {
                return interaction.reply({
                    content: '❌ Music system is not available right now.',
                    ephemeral: true
                });
            }

            // Get current DJ settings
            const guildSettings = await client.database.getGuildSettings(interaction.guildId);
            
            const embed = new EmbedBuilder()
                .setTitle('🎛️ DJ Settings')
                .setColor('#000000')
                .setTimestamp();

            if (guildSettings?.dj_role_id) {
                const djRole = interaction.guild.roles.cache.get(guildSettings.dj_role_id);
                
                if (djRole) {
                    embed.setDescription(`Current DJ role: **${djRole.name}**`);
                    embed.addFields({
                        name: '👥 Role Info',
                        value: `**Name:** ${djRole.name}\n**ID:** ${djRole.id}\n**Members:** ${djRole.members.size}`,
                        inline: true
                    });
                    embed.addFields({
                        name: '🎵 DJ Permissions',
                        value: '• Pause/Resume music\n• Skip tracks\n• Adjust volume\n• Control queue\n• Seek in tracks\n• Set loop modes',
                        inline: true
                    });
                } else {
                    embed.setDescription('❌ DJ role is set but the role no longer exists.');
                    embed.addFields({
                        name: '🔧 Fix',
                        value: 'Use `/dj remove` to clear the invalid DJ role setting.',
                        inline: false
                    });
                }
            } else {
                embed.setDescription('No DJ role is currently set for this server.');
                embed.addFields({
                    name: '🔧 Setup',
                    value: 'Use `/dj set <role>` to set a DJ role.',
                    inline: false
                });
                embed.addFields({
                    name: '⚠️ Current Permissions',
                    value: 'Only users with Administrator or Manage Guild permissions can control music.',
                    inline: false
                });
            }

            await interaction.reply({ embeds: [embed] });

            Logger.command('djList', interaction.user.tag, interaction.guild?.name || 'DM');

        } catch (error) {
            Logger.error('Error in dj list command:', error);
            await interaction.reply({
                content: '❌ An error occurred while listing DJ settings.',
                ephemeral: true
            });
        }
    }
};
