# 🎵 Moosek Music Bot - Official Source Code

[![Discord](https://img.shields.io/discord/1234567890123456789?color=5865F2&logo=discord&logoColor=white)](https://discord.gg/moosek)
[![GitHub stars](https://img.shields.io/github/stars/ryxu-xo/moosek-music-bot?style=social)](https://github.com/ryxu-xo/moosek-music-bot)
[![NPM](https://img.shields.io/npm/v/ryxu-xo-euralink?color=red&logo=npm)](https://www.npmjs.com/package/ryxu-xo-euralink)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> **⚠️ OFFICIAL SOURCE CODE** - This is the official, production-ready source code for Moosek Music Bot. Built by [ryxu-xo](https://github.com/ryxu-xo), the creator of Euralink V4.

A professional, high-performance Discord music bot built with Discord.js v14 and Euralink V4. Features advanced music capabilities, slash commands, smart node switching, voice resilience, and a scalable architecture designed for production use.

## 🌟 **Why Choose Moosek?**

- **🚀 Built by the Euralink Creator** - Developed by ryxu-xo, the creator of the Euralink V4 library
- **⚡ High Performance** - HTTP/2 support, connection pooling, and smart caching
- **🛡️ Production Ready** - Comprehensive error handling, logging, and monitoring
- **🎵 Advanced Features** - SponsorBlock, audio filters, lyrics, and more
- **🔧 Fully Customizable** - Clean, modular codebase that's easy to extend
- **📊 Real-time Metrics** - Built-in performance monitoring and health checks

## ✨ **Features**

### 🎵 **Music System**
- **Multi-Platform Support**: YouTube, Spotify, SoundCloud, and more
- **Smart Source Detection**: Automatically chooses the best source for your query
- **Advanced Queue Management**: Pagination, smart shuffle, and history tracking
- **Audio Processing**: Built-in filters, EQ, and effects
- **Voice Resilience**: Auto-recovery from disconnections and stuck tracks

### 🎛️ **Advanced Capabilities**
- **SponsorBlock Integration**: Automatic ad and sponsor segment skipping
- **Lyrics Support**: Real-time lyrics display with synced timing
- **Chapter Support**: Automatic chapter detection and navigation
- **Persistence**: Auto-resume music after bot restarts
- **Smart Node Switching**: Automatic failover between Lavalink nodes

### 🛠️ **Developer Features**
- **Slash Commands**: Modern Discord slash command interface
- **Modular Architecture**: Easy to add new commands and features
- **Database Ready**: SQLite with comprehensive schema for playlists and settings
- **Professional Logging**: Winston with structured logging and colored output
- **TypeScript Support**: Full TypeScript definitions available

## 🚀 **Quick Start**

### Prerequisites

- **Node.js** 16.0.0 or higher
- **Discord Bot Token** from [Discord Developer Portal](https://discord.com/developers/applications)
- **Lavalink Server** (or use the provided public node)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ryxu-xo/moosek.git
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
   GUILD_ID=your_guild_id_here  # Optional for faster command registration
   ```

4. **Start the bot**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

## 📁 **Project Structure**

```
moosek-music-bot/
├── src/
│   ├── commands/           # Slash commands
│   │   ├── music/         # Music-related commands
│   │   └── general/       # General commands
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

## 🎮 **Commands**

### 🎵 **Music Commands**

| Command | Description | Usage | Permission |
|---------|-------------|-------|------------|
| `/play` | Play music from various sources | `/play <query> [source]` | Everyone |
| `/pause` | Pause the current track | `/pause` | DJ Role |
| `/resume` | Resume the paused track | `/resume` | DJ Role |
| `/skip` | Skip current track(s) | `/skip [amount]` | DJ Role |
| `/stop` | Stop music and clear queue | `/stop` | DJ Role |
| `/queue` | Display the music queue | `/queue [page]` | Everyone |
| `/volume` | Adjust volume (0-1000) | `/volume <level>` | DJ Role |
| `/seek` | Seek to position in track | `/seek <position>` | DJ Role |
| `/loop` | Set loop mode | `/loop <none/track/queue>` | DJ Role |
| `/shuffle` | Shuffle the queue | `/shuffle [type]` | DJ Role |
| `/lyrics` | Get lyrics for current track | `/lyrics` | Everyone |
| `/nowplaying` | Show current track info | `/nowplaying` | Everyone |
| `/clear` | Clear the music queue | `/clear` | DJ Role |
| `/remove` | Remove a track from queue | `/remove <position>` | DJ Role |
| `/move` | Move a track in queue | `/move <from> <to>` | DJ Role |

### 🔧 **General Commands**

| Command | Description | Usage | Permission |
|---------|-------------|-------|------------|
| `/help` | Show all available commands | `/help` | Everyone |
| `/ping` | Check bot latency | `/ping` | Everyone |
| `/invite` | Get bot invite link | `/invite` | Everyone |
| `/support` | Get support server link | `/support` | Everyone |
| `/stats` | Show bot statistics | `/stats` | Everyone |

### 🎛️ **DJ Commands**

| Command | Description | Usage | Permission |
|---------|-------------|-------|------------|
| `/dj set` | Set DJ role for this server | `/dj set <role>` | Administrator |
| `/dj remove` | Remove DJ role | `/dj remove` | Administrator |
| `/dj list` | List current DJ settings | `/dj list` | Everyone |
| `/dj add` | Add user to DJ role | `/dj add <user>` | Administrator |
| `/dj remove` | Remove user from DJ role | `/dj remove <user>` | Administrator |

### ⚙️ **Utility Commands**

| Command | Description | Usage | Permission |
|---------|-------------|-------|------------|
| `/serverinfo` | Show server information | `/serverinfo` | Everyone |
| `/userinfo` | Show user information | `/userinfo [user]` | Everyone |
| `/avatar` | Get user avatar | `/avatar [user]` | Everyone |
| `/uptime` | Show bot uptime | `/uptime` | Everyone |
| `/version` | Show bot version info | `/version` | Everyone |

### 👑 **Admin Commands**

| Command | Description | Usage | Permission |
|---------|-------------|-------|------------|
| `/admin prefix` | Set custom prefix | `/admin prefix <prefix>` | Administrator |
| `/admin channel` | Set music channel | `/admin channel <channel>` | Administrator |
| `/admin settings` | View server settings | `/admin settings` | Administrator |
| `/admin reset` | Reset server settings | `/admin reset` | Administrator |
| `/admin blacklist` | Manage blacklisted users | `/admin blacklist <add/remove> <user>` | Administrator |

## ⚙️ **Configuration**

The bot uses a comprehensive configuration system in `src/config/config.js`. Key settings include:

### **Discord Settings**
- Bot token and client ID
- Intents and partials configuration
- Guild-specific settings

### **Lavalink Settings**
- Node configuration and connection options
- Smart switching and failover settings
- Performance optimization options

### **Music Settings**
- Default volume and audio settings
- Voice resilience configuration
- SponsorBlock and filter settings

### **Database Settings**
- SQLite configuration
- Table schemas and relationships
- Data persistence options

## 🛠️ **Development**

### **Adding New Commands**

1. Create a new file in `src/commands/[category]/`
2. Export an object with `data` and `execute` properties
3. The command will be automatically loaded

**Example:**
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

### **Adding New Events**

1. Create a new file in `src/events/`
2. Export an object with `name` and `execute` properties
3. The event will be automatically loaded

### **Database Operations**

The bot includes a comprehensive database system for:
- **Guild Settings**: Prefix, music channels, DJ roles
- **User Preferences**: Volume, shuffle, lyrics display
- **Playlists**: Custom playlists with track management
- **Music Statistics**: Play tracking and analytics
- **Bot Statistics**: Performance and usage metrics

## 📊 **Monitoring & Analytics**

### **Built-in Monitoring**
- Real-time performance metrics
- Music statistics tracking
- Error logging and reporting
- Health checks for Lavalink nodes

### **Logging System**
- **Winston Logger**: Structured logging with multiple levels
- **Chalk Integration**: Colored console output
- **File Rotation**: Automatic log file management
- **Error Tracking**: Comprehensive error reporting

### **Metrics Available**
- Node health and performance
- Player statistics and usage
- Memory and CPU usage
- Network latency and throughput

## 🔧 **Troubleshooting**

### **Common Issues**

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

### **Logs**

Logs are stored in the `logs/` directory:
- `combined.log` - All log levels
- `error.log` - Error logs only

## 🤝 **Contributing**

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Guidelines**
- Follow the existing code style
- Add JSDoc comments for new functions
- Test your changes thoroughly
- Update documentation as needed

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **[Discord.js](https://discord.js.org/)** - Discord API wrapper
- **[Euralink V4](https://github.com/ryxu-xo/euralink)** - Lavalink wrapper by ryxu-xo
- **[Lavalink](https://github.com/Frederikam/Lavalink)** - Audio node system
- **[ryxu-xo](https://github.com/ryxu-xo)** - Creator and maintainer

## 📞 **Support & Community**

### **Get Help**
- **GitHub Issues**: [Report bugs or request features](https://github.com/ryxu-xo/moosek-music-bot/issues)
- **Discord Server**: [Join our community](https://discord.gg/moosek)
- **Documentation**: [Comprehensive guides](https://docs.moosek.music)

### **Stay Updated**
- **GitHub**: Watch for releases and updates
- **Discord**: Get notified of new features
- **Top.gg**: Vote and review the bot

## 🌟 **Star History**

[![Star History Chart](https://api.star-history.com/svg?repos=ryxu-xo/moosek-music-bot&type=Date)](https://star-history.com/#ryxu-xo/moosek-music-bot&Date)

---

<div align="center">

**Made with ❤️ by [ryxu-xo](https://github.com/ryxu-xo)**

*The official source code for Moosek Music Bot*

[![GitHub](https://img.shields.io/badge/GitHub-ryxu--xo-black?logo=github)](https://github.com/ryxu-xo)
[![Discord](https://img.shields.io/badge/Discord-Moosek-5865F2?logo=discord)](https://discord.gg/moosek)
[![Top.gg](https://img.shields.io/badge/Top.gg-Moosek-7289DA?logo=discord)](https://top.gg/bot/moosek)

</div>
