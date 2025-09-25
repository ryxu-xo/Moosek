/**
 * @fileoverview Event handler for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const AsciiTable = require('ascii-table');
const Logger = require('../utils/logger');

/**
 * Event handler class that manages Discord events
 */
class EventHandler {
    /**
     * Creates a new EventHandler instance
     * @param {Client} client - The Discord client instance
     */
    constructor(client) {
        this.client = client;
        this.events = new Map();
        this.eventPath = path.join(__dirname, '../events');
    }

    /**
     * Loads all events from the events directory
     */
    async loadEvents() {
        const table = new AsciiTable()
            .setHeading('Event', 'Status', 'Type')
            .setBorder('│', '─', '┼', '┘');

        try {
            const eventFiles = fs.readdirSync(this.eventPath)
                .filter(file => file.endsWith('.js'));

            for (const file of eventFiles) {
                try {
                    const filePath = path.join(this.eventPath, file);
                    const event = require(filePath);

                    // Validate event structure
                    if (!event.name || !event.execute) {
                        table.addRow(file, chalk.red('❌ Invalid'), 'Event');
                        Logger.warn(`Event ${file} is missing required properties`);
                        continue;
                    }

                    // Set event type
                    event.type = event.once ? 'Once' : 'On';

                    // Store event
                    this.events.set(event.name, event);

                    // Register event listener
                    if (event.once) {
                        this.client.once(event.name, (...args) => event.execute(...args, this.client));
                    } else {
                        this.client.on(event.name, (...args) => event.execute(...args, this.client));
                    }

                    table.addRow(event.name, chalk.green('✓ Loaded'), event.type);
                    Logger.debug(`Loaded event: ${event.name} (${event.type})`);
                } catch (error) {
                    table.addRow(file, chalk.red('❌ Error'), 'Event');
                    Logger.error(`Error loading event ${file}:`, error);
                }
            }

            console.log(table.toString());
            Logger.success(`Loaded ${this.events.size} events`);
        } catch (error) {
            Logger.error('Error loading events:', error);
        }
    }

    /**
     * Reloads a specific event
     * @param {string} eventName - The name of the event to reload
     */
    async reloadEvent(eventName) {
        try {
            const event = this.events.get(eventName);
            if (!event) {
                Logger.warn(`Event ${eventName} not found`);
                return false;
            }

            // Remove existing listeners
            this.client.removeAllListeners(eventName);

            // Reload the event file
            delete require.cache[require.resolve(path.join(this.eventPath, `${eventName}.js`))];
            const newEvent = require(path.join(this.eventPath, `${eventName}.js`));

            // Validate new event
            if (!newEvent.name || !newEvent.execute) {
                Logger.error(`Invalid event structure for ${eventName}`);
                return false;
            }

            // Update stored event
            this.events.set(eventName, newEvent);

            // Re-register event listener
            if (newEvent.once) {
                this.client.once(newEvent.name, (...args) => newEvent.execute(...args, this.client));
            } else {
                this.client.on(newEvent.name, (...args) => newEvent.execute(...args, this.client));
            }

            Logger.success(`Reloaded event: ${eventName}`);
            return true;
        } catch (error) {
            Logger.error(`Error reloading event ${eventName}:`, error);
            return false;
        }
    }

    /**
     * Gets an event by name
     * @param {string} name - The event name
     * @returns {Object|null} The event object or null if not found
     */
    getEvent(name) {
        return this.events.get(name) || null;
    }

    /**
     * Gets all events
     * @returns {Map} Map of all events
     */
    getAllEvents() {
        return this.events;
    }

    /**
     * Gets events by type (once or on)
     * @param {string} type - The event type ('once' or 'on')
     * @returns {Array} Array of events of the specified type
     */
    getEventsByType(type) {
        return Array.from(this.events.values()).filter(event => 
            type === 'once' ? event.once : !event.once
        );
    }
}

module.exports = EventHandler;
