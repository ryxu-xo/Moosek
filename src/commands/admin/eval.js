/**
 * @fileoverview Eval command for Moosek Music Bot - Developer only
 * @author ryxu-xo
 * @version 1.0.0
 */

const { SlashCommandBuilder, EmbedBuilder, codeBlock } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eval')
        .setDescription('Execute JavaScript code (Developer only)')
        .addStringOption(option =>
            option
                .setName('code')
                .setDescription('JavaScript code to execute')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option
                .setName('async')
                .setDescription('Execute code asynchronously')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('silent')
                .setDescription('Execute silently (no output)')
                .setRequired(false)
        ),

    cooldown: 0,
    ownerOnly: true, // This should be checked in the handler

    /**
     * Executes the eval command
     * @param {CommandInteraction} interaction - The interaction object
     * @param {Client} client - The Discord client
     */
    async execute(interaction, client) {
        try {
            // Check if user is bot owner
            if (interaction.user.id !== client.application.ownerId) {
                return interaction.reply({
                    content: '❌ This command is restricted to bot owners only.',
                    flags: 64
                });
            }

            const code = interaction.options.getString('code');
            const isAsync = interaction.options.getBoolean('async') || false;
            const silent = interaction.options.getBoolean('silent') || false;

            // Defer reply if not silent
            if (!silent) {
                await interaction.deferReply({ flags: 64 });
            }

            // Prepare evaluation context
            const context = {
                client,
                interaction,
                guild: interaction.guild,
                channel: interaction.channel,
                user: interaction.user,
                member: interaction.member,
                musicManager: client.musicManager,
                Logger,
                require,
                process,
                console,
                Buffer,
                setTimeout,
                setInterval,
                clearTimeout,
                clearInterval,
                Date,
                Math,
                JSON,
                Array,
                Object,
                String,
                Number,
                Boolean,
                RegExp,
                Error,
                Promise,
                Map,
                Set,
                WeakMap,
                WeakSet,
                Symbol,
                BigInt,
                globalThis,
                global
            };

            // Wrap code in async function if needed
            const wrappedCode = isAsync 
                ? `(async () => { ${code} })()`
                : code;

            // Execute the code
            const startTime = process.hrtime.bigint();
            let result = eval(wrappedCode);
            const endTime = process.hrtime.bigint();
            const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

            // Handle promises
            if (result instanceof Promise) {
                result = await result;
            }

            // Convert result to string
            let output = result;
            if (typeof output !== 'string') {
                output = require('util').inspect(output, { 
                    depth: 0,
                    maxArrayLength: 100,
                    maxStringLength: 1000,
                    compact: false,
                    colors: false
                });
            }

            // Truncate if too long
            if (output.length > 1900) {
                output = output.substring(0, 1900) + '...';
            }

            // Create response embed
            const embed = new EmbedBuilder()
                .setTitle('🔧 Eval Result')
                .setColor('#000000')
                .addFields(
                    {
                        name: '📝 Input',
                        value: codeBlock('js', code.length > 1000 ? code.substring(0, 1000) + '...' : code),
                        inline: false
                    },
                    {
                        name: '📤 Output',
                        value: codeBlock('js', output),
                        inline: false
                    },
                    {
                        name: '⏱️ Execution Time',
                        value: `${executionTime.toFixed(2)}ms`,
                        inline: true
                    },
                    {
                        name: '🔄 Type',
                        value: isAsync ? 'Async' : 'Sync',
                        inline: true
                    },
                    {
                        name: '🔇 Silent',
                        value: silent ? 'Yes' : 'No',
                        inline: true
                    }
                )
                .setFooter({
                    text: 'Made with ❤️ by ryxu-xo • Developer Command',
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Send response
            if (silent) {
                await interaction.reply({
                    content: '✅ Code executed silently.',
                    flags: 64
                });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }

            // Log the eval command
            Logger.command('eval', interaction.user.tag, interaction.guild?.name || 'DM', {
                code: code.substring(0, 100),
                executionTime: executionTime,
                isAsync: isAsync,
                silent: silent,
                success: true
            });

        } catch (error) {
            Logger.error('Error in eval command:', error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Eval Error')
                .setColor('#ff0000')
                .addFields(
                    {
                        name: '📝 Input',
                        value: codeBlock('js', code.length > 1000 ? code.substring(0, 1000) + '...' : code),
                        inline: false
                    },
                    {
                        name: '💥 Error',
                        value: codeBlock('js', error.message),
                        inline: false
                    },
                    {
                        name: '📊 Stack Trace',
                        value: codeBlock('js', error.stack?.substring(0, 1000) || 'No stack trace available'),
                        inline: false
                    }
                )
                .setFooter({
                    text: 'Made with ❤️ by ryxu-xo • Developer Command',
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp();

            try {
                if (silent) {
                    await interaction.reply({
                        content: '❌ Code execution failed.',
                        flags: 64
                    });
                } else {
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
            } catch (replyError) {
                Logger.error('Failed to send error response:', replyError);
            }

            // Log the error
            Logger.command('eval', interaction.user.tag, interaction.guild?.name || 'DM', {
                code: code.substring(0, 100),
                error: error.message,
                success: false
            });
        }
    }
};
