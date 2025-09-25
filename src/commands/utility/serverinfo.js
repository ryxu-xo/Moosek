/**
 * @fileoverview Server Info command for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Show information about this server'),

    cooldown: 3,

    /**
     * Executes the serverinfo command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            const guild = interaction.guild;
            const owner = await guild.fetchOwner();
            const channels = guild.channels.cache;
            const roles = guild.roles.cache;
            const emojis = guild.emojis.cache;

            const embed = new EmbedBuilder()
                .setTitle('📊 Server Information')
                .setColor('#000000')
                .setThumbnail(guild.iconURL())
                .setTimestamp();

            // Basic Info
            embed.addFields({
                name: '📋 Basic Info',
                value: `**Name:** ${guild.name}\n**ID:** ${guild.id}\n**Owner:** ${owner.user.tag}\n**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
                inline: true
            });

            // Server Stats
            embed.addFields({
                name: '📊 Statistics',
                value: `**Members:** ${guild.memberCount}\n**Channels:** ${channels.size}\n**Roles:** ${roles.size}\n**Emojis:** ${emojis.size}`,
                inline: true
            });

            // Channel Breakdown
            const textChannels = channels.filter(c => c.type === 0).size;
            const voiceChannels = channels.filter(c => c.type === 2).size;
            const categories = channels.filter(c => c.type === 4).size;

            embed.addFields({
                name: '📺 Channels',
                value: `**Text:** ${textChannels}\n**Voice:** ${voiceChannels}\n**Categories:** ${categories}`,
                inline: true
            });

            // Server Features
            const features = guild.features;
            const featureList = features.length > 0 ? features.slice(0, 5).join(', ') : 'None';
            
            embed.addFields({
                name: '✨ Features',
                value: featureList + (features.length > 5 ? ` +${features.length - 5} more` : ''),
                inline: false
            });

            // Verification Level
            const verificationLevels = {
                0: 'None',
                1: 'Low',
                2: 'Medium',
                3: 'High',
                4: 'Very High'
            };

            embed.addFields({
                name: '🔒 Security',
                value: `**Verification:** ${verificationLevels[guild.verificationLevel]}\n**2FA Required:** ${guild.mfaLevel === 1 ? 'Yes' : 'No'}`,
                inline: true
            });

            // Boost Info
            if (guild.premiumTier > 0) {
                embed.addFields({
                    name: '🚀 Boost Info',
                    value: `**Tier:** ${guild.premiumTier}\n**Boosts:** ${guild.premiumSubscriptionCount}`,
                    inline: true
                });
            }

            await interaction.reply({ embeds: [embed] });

            Logger.command('serverinfo', interaction.user.tag, interaction.guild?.name || 'DM');

        } catch (error) {
            Logger.error('Error in serverinfo command:', error);
            await interaction.reply({
                content: '❌ An error occurred while getting server information.',
                ephemeral: true
            });
        }
    }
};
