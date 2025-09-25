/**
 * @fileoverview DJ Remove command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dj')
        .setDescription('DJ role management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove the DJ role for this server')
        ),

    cooldown: 5,

    /**
     * Executes the dj remove command
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

            const musicManager = client.musicManager;
            
            if (!musicManager) {
                return interaction.reply({
                    content: '❌ Music system is not available right now.',
                    ephemeral: true
                });
            }

            // Get current DJ role
            const guildSettings = await client.database.getGuildSettings(interaction.guildId);
            
            if (!guildSettings?.dj_role_id) {
                return interaction.reply({
                    content: '❌ No DJ role is currently set for this server.',
                    ephemeral: true
                });
            }

            // Remove DJ role from database
            await client.database.setGuildSettings(interaction.guildId, {
                dj_role_id: null
            });

            const embed = new EmbedBuilder()
                .setTitle('🎛️ DJ Role Removed')
                .setDescription('DJ role has been removed from this server')
                .setColor('#000000')
                .setTimestamp();

            embed.addFields({
                name: '⚠️ Note',
                value: 'Only users with Administrator or Manage Guild permissions can now control music.',
                inline: false
            });

            await interaction.reply({ embeds: [embed] });

            Logger.music('djRemove', interaction.guildId, {
                user: interaction.user.tag,
                removedRoleId: guildSettings.dj_role_id
            });

        } catch (error) {
            Logger.error('Error in dj remove command:', error);
            await interaction.reply({
                content: '❌ An error occurred while removing the DJ role.',
                ephemeral: true
            });
        }
    }
};
