const uuid = require('uuid');
const crypto = require('crypto');
const _ = require('lodash');

const logger = require('./logger');
const GameChat = require('./game/GameChat');

class PendingGame {
    constructor(owner, details) {
        this.owner = owner;
        this.players = {};
        this.spectators = {};
        this.id = uuid.v1();
        this.name = details.name;
        this.allowSpectators = details.allowSpectators;
        this.started = false;
        this.createdAt = new Date();
        this.gameChat = new GameChat();
    }

    // GETTERS
    getPlayersAndSpectators() {
        return Object.assign({}, this.players, this.spectators);
    }

    getPlayers() {
        return this.players;
    }

    getPlayerOrSpectator(playerName) {
        return this.getPlayersAndSpectators()[playerName];
    }

    getPlayerByName(playerName) {
        return this.players[playerName];
    }

    // ACTIONS
    addMessage() {
        this.gameChat.addMessage(...arguments);
    }

    addChatMessage(player, message) {
        this.gameChat.addMessage(message, {user: player.user}, 'chat');
    }

    addPlayer(id, user) {
        if(!user) {
            logger.error('Tried to add a player to a game that did not have a user object');
            return;
        }

        this.players[user.username] = {
            id: id,
            name: user.username,
            gravatar: user.gravatar,
            user: user,
            owner: this.owner.username == user.username
        };
    }

    addSpectator(id, user) {
        this.spectators[user.username] = {
            id: id,
            name: user.username,
            gravatar: user.gravatar,
            user: user
        };
    }

    newGame(id, user, password) {
        if(password) {
            this.password = crypto.createHash('md5').update(password).digest('hex');
        }

        this.addPlayer(id, user);
        this.addMessage('game.connection.created', {player: user.username});
    }

    join(id, user, password) {
        // TODO customizable (by game) amount of players
        if(_.size(this.players) >= 4 || this.started) {
            return;
        }

        // TODO prevent join user of block list

        if(this.password) {
            if(crypto.createHash('md5').update(password).digest('hex') !== this.password) {
                return 'Incorrect game password';
            }
        }

        this.addPlayer(id, user);
        this.addMessage('game.connection.join', {player: user.username});
    }

    watch(id, user, password) {
        if(!this.allowSpectators) {
            return;
        }

        // TODO prevent join user of block list

        if(this.password) {
            if(crypto.createHash('md5').update(password).digest('hex') !== this.password) {
                return 'Incorrect game password';
            }
        }

        this.addSpectator(id, user);
        this.addMessage('game.connection.watch', {player: user.username});
    }

    leave(playerName) {
        let player = this.getPlayerOrSpectator(playerName);
        if(!player) {
            return;
        }

        if(!this.started) {
            this.addMessage('game.connection.leave', {player: playerName});
        }

        if(this.players[playerName]) {
            if(this.started) {
                this.players[playerName].left = true;
            } else {
                this.removeAndResetOwner(playerName);

                delete this.players[playerName];
            }
        }

        if(this.spectators[playerName]) {
            delete this.spectators[playerName];
        }
    }

    disconnect(playerName) {
        let player = this.getPlayerOrSpectator(playerName);
        if(!player) {
            return;
        }

        if(!this.started) {
            this.addMessage('game.connection.disconnect', {player: playerName});
        }

        if(this.players[playerName]) {
            if(!this.started) {
                this.removeAndResetOwner(playerName);

                delete this.players[playerName];
            }
        } else {
            delete this.spectators[playerName];
        }
    }

    removeAndResetOwner(playerName) {
        if(this.isOwner(playerName)) {
            let otherPlayer = _.find(this.players, player => player.name !== playerName);
            if(otherPlayer) {
                this.owner = otherPlayer;
                otherPlayer.owner = true;
            }
        }
    }

    selectLineup(playerName, lineup) {
        let player = this.getPlayerByName(playerName);
        if(!player) {
            return;
        }

        if(player.lineup) {
            player.lineup.selected = false;
        }

        player.lineup = lineup;
        player.lineup.selected = true;
        //this.addMessage('game.connection.selectdeck', {player: player.name});
    }
    
    chat(playerName, message) {
        let player = this.getPlayerOrSpectator(playerName);
        if(!player) {
            return;
        }

        this.addChatMessage(player, message);
    }

    // INTERROGATORS
    isEmpty() {
        return !_.some(this.getPlayersAndSpectators(), player => this.hasActivePlayer(player.name));
    }

    isOwner(playerName) {
        let player = this.players[playerName];

        if(!player || !player.owner) {
            return false;
        }

        return true;
    }

    hasActivePlayer(playerName) {
        return this.players[playerName] && !this.players[playerName].left && !this.players[playerName].disconnected || this.spectators[playerName];
    }

    // SUMMARY
    getSaveState() {
        let players = _.map(this.getPlayers(), player => {
            return {
                name: player.name,
                gravatar: player.gravatar
            };
        });

        return {
            gameId: this.id,
            players: players,
            startedAt: this.createdAt
        };
    }
	
    getSummary(activePlayerName) {
        let playerSummaries = {};
        let playersInGame = _.filter(this.players, player => !player.left);
        let activePlayer = activePlayerName ? this.getPlayerOrSpectator(activePlayerName) : undefined;

        _.each(playersInGame, player => {
            playerSummaries[player.name] = {
                id: player.id,
                name: player.name,
                gravatar: player.gravatar,
                left: player.left,
                owner: player.owner
            };
        });

        return {
            allowSpectators: this.allowSpectators,
            createdAt: this.createdAt,
            id: this.id,
            name: this.name,
            owner: this.owner.username,
            messages: activePlayer ? this.gameChat.getMessages(activePlayer.user.locale) : undefined,
            node: this.node ? this.node.identity : undefined,
            players: playerSummaries,
            started: this.started,
            spectators: _.map(this.spectators, spectator => {
                return {
                    id: spectator.id,
                    name: spectator.name,
                    gravatar: spectator.gravatar
                };
            })
        };
    }
}

module.exports = PendingGame;
