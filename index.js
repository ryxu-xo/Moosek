/**
 * @fileoverview Main entry point for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const chalk = require('chalk');
const MoosekClient = require('./src/structure/client');
const Logger = require('./src/utils/logger');

// Display startup banner
console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ███╗   ███╗ ██████╗  ██████╗ ███████╗███████╗██╗  ██╗     ║
║    ████╗ ████║██╔═══██╗██╔═══██╗██╔════╝██╔════╝██║ ██╔╝     ║
║    ██╔████╔██║██║   ██║██║   ██║███████╗█████╗  █████╔╝      ║
║    ██║╚██╔╝██║██║   ██║██║   ██║╚════██║██╔══╝  ██╔═██╗      ║
║    ██║ ╚═╝ ██║╚██████╔╝╚██████╔╝███████║███████╗██║  ██╗     ║
║    ╚═╝     ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝     ║
║                                                              ║
║                    🎵 MUSIC BOT V1.0.0 🎵                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`));

// Check Node.js version
const nodeVersion = process.version;
const requiredVersion = 16;
const currentVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (currentVersion < requiredVersion) {
    console.error(chalk.red.bold('❌ Error: Node.js version 16 or higher is required!'));
    console.error(chalk.red(`   Current version: ${nodeVersion}`));
    console.error(chalk.red(`   Required version: ${requiredVersion}+`));
    process.exit(1);
}

// Check for required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(chalk.red.bold('❌ Error: Missing required environment variables!'));
    console.error(chalk.red(`   Missing: ${missingEnvVars.join(', ')}`));
    console.error(chalk.yellow('   Please check your .env file or environment variables.'));
    process.exit(1);
}

// Create and initialize the bot
const client = new MoosekClient();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Received SIGINT, shutting down gracefully...'));
    client.shutdown('SIGINT');
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n🛑 Received SIGTERM, shutting down gracefully...'));
    client.shutdown('SIGTERM');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    Logger.error('Uncaught Exception:', error);
    client.shutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    client.shutdown('unhandledRejection');
});

// Handle raw Discord events for voice state updates
client.on('raw', (packet) => {
    if (![
        'VOICE_STATE_UPDATE', 
        'VOICE_SERVER_UPDATE'
    ].includes(packet.t)) return;
    
    if (client.musicManager) {
        client.musicManager.updateVoiceState(packet);
    }
});

// Start the bot
(async () => {
    try {
        await client.initialize();
    } catch (error) {
        Logger.error('Failed to start bot:', error);
        process.exit(1);
    }
})();

// Export for testing purposes
module.exports = client;
