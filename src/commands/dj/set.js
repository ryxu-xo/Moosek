/**
 * @fileoverview DJ Set command for Moosek Music Bot
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
                .setName('set')
                .setDescription('Set the DJ role for this server')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to set as DJ role')
                        .setRequired(true)
                )
        ),

    cooldown: 5,

    /**
     * Executes the dj set command
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

            const role = interaction.options.getRole('role');
            const musicManager = client.musicManager;
            
            if (!musicManager) {
                return interaction.reply({
                    content: '❌ Music system is not available right now.',
                    ephemeral: true
                });
            }

            // Save DJ role to database
            await client.database.setGuildSettings(interaction.guildId, {
                dj_role_id: role.id
            });

            const embed = new EmbedBuilder()
                .setTitle('🎛️ DJ Role Set')
                .setDescription(`DJ role has been set to **${role.name}**`)
                .setColor('#000000')
                .setTimestamp();

            embed.addFields({
                name: '👥 Role Info',
                value: `**Name:** ${role.name}\n**ID:** ${role.id}\n**Members:** ${role.members.size}`,
                inline: true
            });

            embed.addFields({
                name: '🎵 DJ Permissions',
                value: '• Pause/Resume music\n• Skip tracks\n• Adjust volume\n• Control queue\n• Seek in tracks\n• Set loop modes',
                inline: true
            });

            await interaction.reply({ embeds: [embed] });

            Logger.music('djSet', interaction.guildId, {
                user: interaction.user.tag,
                role: role.name,
                roleId: role.id
            });

        } catch (error) {
            Logger.error('Error in dj set command:', error);
            await interaction.reply({
                content: '❌ An error occurred while setting the DJ role.',
                ephemeral: true
            });
        }
    }
};
