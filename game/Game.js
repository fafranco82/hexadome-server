const _ = require('lodash');
const EventEmitter = require('events');

const Player = require('./Player');
const Spectator = require('./Spectator');
const GameBoard = require('./GameBoard');
const GameChat = require('./GameChat');
const ChatCommands = require('./ChatCommands');
const Pipeline = require('./framework/Pipeline');

const Event = require('./events/Event');
const EventWindow = require('./events/EventWindow');

const SimpleStep = require('./framework/SimpleStep');
const ActionResolver = require('./framework/ActionResolver');
const AbilityResolver = require('./framework/AbilityResolver');
const DiceRollHandler = require('./framework/DiceRollHandler');

const SelectHexPrompt = require('./framework/prompt/SelectHexPrompt');
const SelectPiecePrompt = require('./framework/prompt/SelectPiecePrompt');

const HandlerMenuPrompt = require('./framework/prompt/HandlerMenuPrompt');

const SetupPhase = require('./framework/phases/SetupPhase');
const PlanningPhase = require('./framework/phases/PlanningPhase');
const TurnsPhase = require('./framework/phases/TurnsPhase');
const ObjectivesPhase = require('./framework/phases/ObjectivesPhase');
const RecoveryPhase = require('./framework/phases/RecoveryPhase');

const { EventNames } = require('./Constants');

class Game extends EventEmitter {
	constructor(details, options = {}) {
        super();

        this.id = details.id;
        this.name = details.name;
        this.allowSpectators = details.allowSpectators;
        this.owner = details.owner.username;
        this.savedGameId = details.savedGameId;
        this.password = details.password;

        this.playersAndSpectators = {};
        this.pipeline = new Pipeline();
        this.gameBoard = new GameBoard(this);
        this.gameChat = new GameChat();
        this.chatCommands = new ChatCommands(this);

        this.started = false;
        this.playStarted = false;
        this.createdAt = new Date();

        _.each(details.players, player => {
            this.playersAndSpectators[player.user.username] = new Player(player.id, player.user, this.owner === player.user.username, this);
            this.playersAndSpectators[player.user.username] = new Player(player.id, player.user, this.owner === player.user.username, this);
        });

        _.each(details.spectators, spectator => {
            this.playersAndSpectators[spectator.user.username] = new Spectator(spectator.id, spectator.user);
        });

        this.setMaxListeners(0);

        this.router = options.router;
    }

    // PLAYER AND SPECTATORS FUNCTIONS
    getPlayers() {
        return Object.values(this.playersAndSpectators).filter(player => !player.isSpectator());
    }

    getNumberOfPlayers() {
        return this.getPlayers().length;
    }

    getSpectators() {
        return Object.values(this.playersAndSpectators).filter(player => player.isSpectator());
    }

    getPlayersAndSpectators() {
        return this.playersAndSpectators;
    }

    getPlayerOrSpectator(name) {
        return this.playersAndSpectators[name];
    }

    getPlayerByName(playerName) {
        let player = this.getPlayerOrSpectator(playerName);

        if(!player || player.isSpectator()) {
            return;
        }

        return player;
    }

    getFirstPlayer() {
        return this.getPlayers()[0];
    }

    getOtherPlayer(currentPlayer) {
        return this.getPlayers().filter(player => currentPlayer !== player)[0];
    }

    isEmpty() {
        return _.every(this.playersAndSpectators, player => {
            return player.disconnected || player.left || player.id === 'TBA';
        });
    }

    arePiecesAtRange(piece1, piece2, range) {
        return this.gameBoard.arePiecesAtRange(piece1, piece2, range);
    }

    hasLineOfSight(piece1, piece2) {
        return this.gameBoard.hasLineOfSight(piece1, piece2);
    }

    // ACTIONS
    selectLineup(playerName, lineup) {
        let player = this.getPlayerByName(playerName);

        if(!player) {
            return;
        }

        player.selectLineup(lineup);
    }

    addMessage() {
        this.gameChat.addMessage(...arguments);
    }

    addAlert(type, message, args) {
        this.gameChat.addMessage(message, args, {main: 'alert', variant: type});
    }

    promptWithHandlerMenu(player, properties) {
        this.queueStep(new HandlerMenuPrompt(this, player, properties));
    }

    promptForSelectHex(player, properties) {
        this.queueStep(new SelectHexPrompt(this, player, properties));
    }

    promptForSelectPiece(player, properties) {
        this.queueStep(new SelectPiecePrompt(this, player, properties));
    }

    resolveAction(context) {
        let resolver = new ActionResolver(this, context);
        this.queueStep(resolver);
        return resolver;
    }

    resolveAbility(context) {
        let resolver = new AbilityResolver(this, context);
        this.queueStep(resolver);
        return resolver;
    }

    makeDiceRoll(properties) {
        let diceRollHandler = new DiceRollHandler(this, properties);
        this.queueStep(diceRollHandler);
        return diceRollHandler;
    }

    // EVENTS HANDLING
    getEvent(eventName, params, handler) {
        return new Event(eventName, params, handler);
    }

    raiseEvent(eventName, params = {}, handler = () => true) {
        //logger.info(`RaiseEvent ${eventName} with params ${JSON.stringify(params)}`);
        /*let event = this.getEvent(eventName, params, handler);
        this.openEventWindow([event]);
        return event;*/
    }

    openEventWindow(events) {
        if(!_.isArray(events)) {
            events = [events];
        }
        return this.queueStep(new EventWindow(this, events));
    }

    reportError(e) {
        this.router.handleError(this, e);
    }

    // GAME ACTIONS
	leave(playerName) {
        let player = this.getPlayerOrSpectator(playerName);

        if(!player) {
            return;
        }

        this.addAlert('info', 'game.connection.leave', {player: player});

        if(player.isSpectator() || !this.started) {
            delete this.playersAndSpectators[playerName];
        } else {
            player.left = true;

            if(!this.finishedAt) { // TODO al irse un jugador, solo se terminaría si quedan más de uno...
                this.finishedAt = new Date();
            }
        }
    }

    chat(playerName, message) {
        let player = this.getPlayerOrSpectator(playerName);
        var args = message.split(' ');

        if(!player) {
            return;
        }

        if(!player.isSpectator()) {
            if(this.chatCommands.executeCommand(player, args[0], args.slice(1))) {
                this.checkGameState(true);
                return;
            }
        }

        this.gameChat.addMessage(message, {user: player.user}, 'chat');
    }

    watch(socketId, user) {
        if(!this.allowSpectators) {
            return false;
        }

        let spectator = new Spectator(socketId, user);
        this.playersAndSpectators[user.username] = spectator;
        this.addAlert('info', 'game.connection.watch', {player: spectator});

        return true;
    }

    disconnect(playerName) {
        let player = this.getPlayerOrSpectator(playerName);

        if(!player) {
            return;
        }

        this.addAlert('warning', 'game.connection.disconnect', {player: player});

        if(player.isSpectator()) {
            delete this.playersAndSpectators[playerName];
        } else {
            player.disconnected = true;
        }

        player.socket = undefined;
    }

    menuButton(playerName, arg, method) {
        let player = this.getPlayerByName(playerName);
        if(!player) {
            return;
        }

        if(this.pipeline.handleMenuCommand(player, arg, method)) {
            return true;
        }
    }

    hexClicked(playerName, x, y) {
        let player = this.getPlayerByName(playerName);
        let position = {x: x, y: y};

        if(!player || !this.gameBoard.existsHex(position)) {
            return;
        }

        if(this.pipeline.handleHexClicked(player, position)) {
            return;
        }
    }

    pieceClicked(playerName, pieceId) {
        let player = this.getPlayerByName(playerName);
        let piece = this.allPieces.find(piece => piece.uuid === pieceId);

        if(!player || !piece) {
            return;
        }

        if(this.pipeline.handlePieceClicked(player, piece)) {
            return;
        }
    }

    // PIPELINE METHODS
    initialise() {
        this.gameBoard.initialise();

    	let players = {};

    	_.each(this.getPlayersAndSpectators(), player => {
            if(!player.left) {
                players[player.name] = player;
            }
        });

        this.playersAndSpectators = players;

        let teams = ['orange', 'green'];
        _.each(this.getPlayers(), player => {
            player.team = teams.pop();
            player.initialise();
        });

        this.allCharacters = _.reduce(this.getPlayers(), (acc, player) => acc.concat(player.characters), []);
        this.allPieces = this.allCharacters.concat(this.gameBoard.blockedSpaces).concat(this.gameBoard.obstacles);

        this.pipeline.initialise([
            new SetupPhase(this),
            new SimpleStep(this, () => this.beginRound())
        ]);

        this.playStarted = true;
        this.startedAt = new Date();

        this.round = 0;

        this.continue();
    }

    beginRound() {
        this.round++;
        this.addAlert('roundstarted', 'game.round.started', {round: this.round});
        this.raiseEvent(EventNames.OnRoundStarted);
        _.each(this.getRoundPhases(), phase => {
            this.queueStep(phase);
        });
        this.queueStep(new SimpleStep(this, () => this.beginRound()));
    }

    getRoundPhases() {
        return [
            new PlanningPhase(this),
            new TurnsPhase(this),
            new ObjectivesPhase(this),
            new RecoveryPhase(this)
        ];
    }

    continue() {
        this.pipeline.continue();
    }

    queueStep(step) {
        this.pipeline.queueStep(step);
        return step;
    }

    queueSimpleStep(handler) {
        this.pipeline.queueStep(new SimpleStep(this, handler));
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
            startedAt: this.startedAt,
            players: players,
            winner: this.winner ? this.winner.name : undefined,
            winReason: this.winReason,
            finishedAt: this.finishedAt
        };
    }

    getState(activePlayerName) {
        let activePlayer = this.getPlayerOrSpectator(activePlayerName);
        let playerState = {};

        if(this.started) {
            _.each(this.getPlayers(), player => {
                playerState[player.name] = player.getState(activePlayer);
            });

            return {
                id: this.id,
                name: this.name,
                owner: this.owner,
                players: playerState,
                board: this.gameBoard.getSummary(activePlayer),
                messages: this.gameChat.getMessages(activePlayer.user.locale),
                spectators: _.map(this.getSpectators(), spectator => {
                    return {
                        id: spectator.id,
                        name: spectator.name,
                        gravatar: spectator.gravatar
                    };
                }),
                started: this.started
            };
        } else {
            return this.getSummary(activePlayerName);
        }
    }

    getSummary(activePlayerName) {
        let playerSummaries = {};

        _.each(this.getPlayers(), (player, idx) => {
            if(player.left) {
                return;
            }

            playerSummaries[player.name] = {
                id: player.id,
                lobbyId: player.lobbyId,
                left: player.left,
                name: player.name,
                gravatar: player.gravatar,
                owner: player.owner,
                user: player.user,
                order: idx
            };
        });

        return {
            allowSpectators: this.allowSpectators,
            createdAt: this.createdAt,
            id: this.id,
            name: this.name,
            owner: this.owner,
            players: playerSummaries,
            messages: this.gameChat.getMessages('en'),
            started: this.started,
            startedAt: this.startedAt,
            spectators: _.map(this.getSpectators(), spectator => {
                return {
                    id: spectator.id,
                    lobbyId: spectator.lobbyId,
                    name: spectator.name,
                    gravatar: spectator.gravatar,
                };
            })
        };
    }
}

module.exports = Game;
