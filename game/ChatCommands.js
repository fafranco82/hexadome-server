
const { Players, Locations } = require('./Constants');

class ChatCommands {
    constructor(game) {
        this.game = game;

        this.commands = {
            // Players theirself
            
            // Cards
        };
    }

    executeCommand(player, command, args) {
        if(!player || !this.commands[command]) {
            return false;
        }

        return this.commands[command].call(this, player, ...args) !== false;
    }

    displayMessage(message, args) {
        this.game.addAlert('warning', message, args);
    }
}

module.exports = ChatCommands;
