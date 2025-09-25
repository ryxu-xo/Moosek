# 🎵 Moosek Music Bot

A professional Discord music bot built with Discord.js v14 and Euralink V4, featuring advanced music capabilities, slash commands, and a scalable architecture.

## ✨ Features

- **🎵 Advanced Music System**: Powered by Euralink V4 with support for YouTube, Spotify, SoundCloud, and more
- **⚡ Slash Commands**: Modern Discord slash command interface
- **🔄 Smart Node Switching**: Automatic failover and load balancing
- **💾 Persistence**: Auto-resume music after bot restarts
- **🎚️ Advanced Filters**: Built-in audio filters and effects
- **📊 Real-time Metrics**: Performance monitoring and statistics
- **🗄️ Database Ready**: SQLite database with playlist and user preference support
- **📝 Professional Logging**: Structured logging with Winston and Chalk
- **🛡️ Error Handling**: Comprehensive error handling and recovery
- **🔧 Extensible**: Easy to add new commands and features

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- A Discord bot token
- A Lavalink server (or use the provided public node)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd moosek-music-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here
   ```

4. **Start the bot**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
moosek-music-bot/
├── src/
│   ├── commands/           # Slash commands
│   │   └── music/         # Music-related commands
│   ├── events/            # Discord events
│   ├── handlers/          # Command and event handlers
│   ├── music/             # Music system (Euralink integration)
│   ├── database/          # Database management
│   ├── utils/             # Utility functions
│   ├── config/            # Configuration files
│   └── structure/         # Core bot structure
├── data/                  # Database and persistence files
├── logs/                  # Log files
├── index.js              # Main entry point
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## 🎮 Commands

### Music Commands

- `/play <query>` - Play music from various sources
- `/pause` - Pause the current track
- `/resume` - Resume the paused track
- `/skip [amount]` - Skip current track(s)
- `/stop` - Stop music and clear queue
- `/queue [page]` - Display the music queue

### Additional Features

- **Smart Source Detection**: Automatically detects the best source for your query
- **Queue Management**: Advanced queue with pagination and controls
- **Audio Filters**: Built-in audio effects and filters
- **Playlist Support**: Save and load custom playlists
- **Statistics**: Track music statistics and bot performance

## ⚙️ Configuration

The bot uses a comprehensive configuration system in `src/config/config.js`. Key settings include:

- **Discord Settings**: Bot token, client ID, intents
- **Lavalink Settings**: Node configuration and options
- **Music Settings**: Default volume, filters, resilience options
- **Database Settings**: SQLite configuration
- **Logging Settings**: Log levels and file rotation

## 🛠️ Development

### Adding New Commands

1. Create a new file in `src/commands/[category]/`
2. Export an object with `data` and `execute` properties
3. The command will be automatically loaded

Example:
```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('example')
        .setDescription('An example command'),
    
    async execute(interaction, client) {
        await interaction.reply('Hello World!');
    }
};
```

### Adding New Events

1. Create a new file in `src/events/`
2. Export an object with `name` and `execute` properties
3. The event will be automatically loaded

### Database Operations

The bot includes a comprehensive database system for:
- Guild settings
- User preferences
- Playlists
- Music statistics
- Bot statistics

## 📊 Monitoring

The bot includes built-in monitoring and metrics:
- Real-time performance metrics
- Music statistics tracking
- Error logging and reporting
- Health checks for Lavalink nodes

## 🔧 Troubleshooting

### Common Issues

1. **Bot not responding to commands**
   - Check if slash commands are registered
   - Verify bot permissions in your server
   - Check console logs for errors

2. **Music not playing**
   - Ensure you're in a voice channel
   - Check Lavalink node connectivity
   - Verify bot has voice permissions

3. **Database errors**
   - Check if the `data/` directory exists
   - Verify SQLite permissions
   - Check database file integrity

### Logs

Logs are stored in the `logs/` directory:
- `combined.log` - All log levels
- `error.log` - Error logs only

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Discord.js](https://discord.js.org/) - Discord API wrapper
- [Euralink V4](https://github.com/ryxu-xo/euralink) - Lavalink wrapper
- [Lavalink](https://github.com/Frederikam/Lavalink) - Audio node system

## 📞 Support

For support, questions, or feature requests:
- Open an issue on GitHub
- Join our Discord server
- Check the documentation

---

**Made with ❤️ by ryxu-xo**
