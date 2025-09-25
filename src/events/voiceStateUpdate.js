/**
 * @fileoverview Voice state update event for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const { Events } = require('discord.js');
const Logger = require('../utils/logger');

module.exports = {
    name: Events.VoiceStateUpdate,

    /**
     * Executes when a voice state is updated
     * @param {VoiceState} oldState - The old voice state
     * @param {VoiceState} newState - The new voice state
     * @param {Client} client - The Discord client
     */
    async execute(oldState, newState, client) {
        try {
            // Handle voice state updates for Euralink
            if (client.musicManager) {
                client.musicManager.updateVoiceState({
                    t: 'VOICE_STATE_UPDATE',
                    d: {
                        guild_id: newState.guild.id,
                        user_id: newState.id,
                        channel_id: newState.channelId,
                        old_channel_id: oldState.channelId,
                        session_id: newState.sessionId
                    }
                });
            }

            // Handle bot disconnection when alone in voice channel
            if (oldState.member?.id === client.user.id && oldState.channelId && !newState.channelId) {
                // Bot was disconnected from voice
                Logger.music('botDisconnected', oldState.guild.id, {
                    channel: oldState.channelId
                });
                
                // Clean up player
                if (client.musicManager) {
                    client.musicManager.destroyPlayer(oldState.guild.id);
                }
                return;
            }

            // Handle user leaving voice channel
            if (oldState.channelId && !newState.channelId) {
                const member = oldState.member;
                if (member && member.id !== client.user.id) {
                    await handleUserLeftVoice(oldState, newState, client);
                }
            }

            // Handle user joining voice channel
            if (!oldState.channelId && newState.channelId) {
                const member = newState.member;
                if (member && member.id !== client.user.id) {
                    await handleUserJoinedVoice(oldState, newState, client);
                }
            }

        } catch (error) {
            Logger.error('Error in voice state update event:', error);
        }
    }
};

/**
 * Handles when a user leaves a voice channel
 * @param {VoiceState} oldState - The old voice state
 * @param {VoiceState} newState - The new voice state
 * @param {Client} client - The Discord client
 */
async function handleUserLeftVoice(oldState, newState, client) {
    const guild = oldState.guild;
    const channel = oldState.channel;
    
    if (!channel) return;

    // Check if bot is in the same voice channel
    const botVoiceState = guild.members.me?.voice;
    if (!botVoiceState || botVoiceState.channelId !== channel.id) return;

    // Count remaining members in voice channel (excluding bots)
    const remainingMembers = channel.members.filter(member => !member.user.bot);
    
    // If only bot remains, disconnect after a delay
    if (remainingMembers.size === 0) {
        Logger.music('aloneInVoice', guild.id, {
            channel: channel.id,
            leftUser: oldState.member.user.tag
        });

        // Wait 2 minutes before disconnecting
        setTimeout(async () => {
            const currentVoiceState = guild.members.me?.voice;
            if (currentVoiceState && currentVoiceState.channelId === channel.id) {
                const currentMembers = channel.members.filter(member => !member.user.bot);
                
                if (currentMembers.size === 0) {
                    Logger.music('autoDisconnect', guild.id, {
                        reason: 'alone_in_voice',
                        channel: channel.id
                    });

                    // Disconnect from voice
                    if (client.musicManager) {
                        client.musicManager.destroyPlayer(guild.id);
                    }

                    // Send notification if possible
                    try {
                        const textChannel = client.channels.cache.get(botVoiceState.textChannel);
                        if (textChannel) {
                            await textChannel.send('🔌 Disconnected from voice channel due to inactivity.');
                        }
                    } catch (error) {
                        Logger.warn('Could not send disconnect notification:', error);
                    }
                }
            }
        }, 120000); // 2 minutes
    }
}

/**
 * Handles when a user joins a voice channel
 * @param {VoiceState} oldState - The old voice state
 * @param {VoiceState} newState - The new voice state
 * @param {Client} client - The Discord client
 */
async function handleUserJoinedVoice(oldState, newState, client) {
    const guild = newState.guild;
    const channel = newState.channel;
    
    if (!channel) return;

    // Check if bot is in the same voice channel
    const botVoiceState = guild.members.me?.voice;
    if (botVoiceState && botVoiceState.channelId === channel.id) {
        Logger.music('userJoinedVoice', guild.id, {
            channel: channel.id,
            user: newState.member.user.tag
        });
    }
}
