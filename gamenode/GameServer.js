const _ = require('lodash');
const fs = require('fs');
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const http = require('http');
const https = require('https');

const Game = require('../game/Game');

const config = require('config');
const logger = require('../logger');
const ZmqSocket = require('./ZmqSocket');
const Socket = require('../Socket');

class GameServer {
    constructor() {
        this.games = {};

        this.protocol = 'https';

        try {
            var privateKey = fs.readFileSync(config.get('gamenode.keyPath')).toString();
            var certificate = fs.readFileSync(config.get('gamenode.certPath')).toString();
        } catch(e) {
            this.protocol = 'http';
        }

        this.host = process.env.HOST || config.get('gamenode.host');

        this.zmqSocket = new ZmqSocket(this.host, this.protocol, /* TODO version */ '2019-02-26');
        // ...bind events
        this.zmqSocket.on('onStartGame', this.onStartGame.bind(this));
        this.zmqSocket.on('onSpectator', this.onSpectator.bind(this));
        this.zmqSocket.on('onGameSync', this.onGameSync.bind(this));

        let server = undefined;
        if(!privateKey || !certificate) {
            server = http.createServer();
        } else {
            server = https.createServer({
                key: privateKey,
                cert: certificate
            });
        }

        server.listen(process.env.PORT || config.get('gamenode.socketio.port'));

        let socketOptions = {
            perMessageDeflate: false
        };

        if(process.env.NODE_ENV !== 'production') {
            socketOptions.path = '/' + (process.env.SERVER || config.get('gamenode.identity')) + '/socket.io';
        }

        this.io = socketio(server, socketOptions);
        this.io.set('heartbeat timeout', 30000);
        this.io.use(this.handshake.bind(this));

        if(process.env.NODE_ENV === 'production') {
            //this.io.set('origins', 'http://www.throneteki.net:* https://www.throneteki.net:* http://www.theironthrone.net:* https://www.theironthrone.net:*');
        }

        this.io.on('connection', this.onConnection.bind(this));

        setInterval(() => this.clearStaleFinishedGames(), 60 * 1000);
    }

    runAndCatchErrors(game, func) {
        try {
            func();
        } catch(e) {
            this.handleError(game, e);
            this.sendGameState(game);
        }
    }

    handleError(game, e) {
        logger.error(`Error running game command: ${e}`);
        console.log(e);

        /*let gameState = game.getState();
        let debugData = {};*/

        if(game) {
            /*game.addMessage(`A Server error has ocurred processing your game state, apologies.
				Your game may now be in an inconsistent state, or you may able to continue.
				The error has been logged,`);*/
        }
    }

    findGameForUser(username) {
        return _.find(this.games, game => {
            let player = game.getPlayerOrSpectator(username);

            if(!player || player.left) {
                return false;
            }

            return true;
        });
    }

    sendGameState(game) {
        _.each(game.getPlayersAndSpectators(), player => {
            if(player.left || player.disconnected || !player.socket) {
                return;
            }
            player.socket.send('gamestate', game.getState(player.name));
        });
    }

    gameWon(game, reason, winner) {
        this.zmqSocket.send('GAMEWIN', {
            game: game.getSaveState(),
            winner: winner.name,
            reason: reason
        });
    }

    clearStaleFinishedGames() {
        const timeout = 20 * 60 * 1000;

        let staleGames = _.filter(this.games, game => {
            return game.finishedAt && (Date.now() - game.finishedAt > timeout);
        });

        for(let game of staleGames) {
            logger.info(`closed finished game ${game.id} due to inactivity`);
            for(let player of Object.values(game.getPlayersAndSpectators())) {
                if(player.socket) {
                    player.socket.tIsClosing = true;
                    player.socket.disconnect();
                }
            }

            delete this.games[game.id];
            this.zmqSocket.send('GAMECLOSED', {game: game.id});
        }
    }

    handshake(socket, next) {
        if(socket.handshake.query.token && socket.handshake.query.token !== 'undefined') {
            jwt.verify(socket.handshake.query.token, config.get('jwt.secret'), function(err, user) {
                if(err) {
                    return;
                }

                socket.request.user = user;
            });
        }

        next();
    }

    // Socket.IO EVENTS
    onConnection(ioSocket) {
        if(!ioSocket.request.user) {
            logger.info('socket connected with no user, disconnecting');
            ioSocket.disconnect();
            return;
        }

        let game = this.findGameForUser(ioSocket.request.user.username);
        if(!game) {
            logger.info(`No game for ${ioSocket.request.user.username}, disconnecting`);
            ioSocket.disconnect();
            return;
        }

        let socket = new Socket(ioSocket);

        let player = game.getPlayerOrSpectator(socket.user.username);
        if(!player) {
            return;
        }

        player.lobbyId = player.id;
        player.id = socket.id;
        player.connectionSucceeded = true;
        if(player.disconnected) {
            logger.info(`user ${socket.user.username} reconnected to game`);
            game.reconnect(socket, player.name);
        }

        socket.joinChannel(game.id);

        player.socket = socket;

        if(!player.isSpectator()) {
            game.addMessage('game.connection.connect', {player: player});
        }

        this.sendGameState(game);

        socket.registerEvent('game', this.onGameMessage.bind(this));
        socket.on('disconnect', this.onSocketDisconnected.bind(this));
    }

    onSocketDisconnected(socket, reason) {
        let game = this.findGameForUser(socket.user.username);
        if(!game) {
            return;
        }

        logger.info(`user ${socket.user.username} disconnected from a game: ${reason}`);

        let player = game.getPlayerOrSpectator(socket.user.username);
        let isSpectator = player && player.isSpectator();

        game.disconnect(socket.user.username);

        if(!socket.tIsClosing) {
            if(game.isEmpty()) {
                delete this.games[game.id];
                this.zmqSocket.send('GAMECLOSED', {game: game.id});
            } else if(isSpectator) {
                this.zmqSocket.send('PLAYERLEFT', {
                    gameId: game.id,
                    game: game.getSaveState(),
                    player: socket.user.username,
                    spectator: true
                });
            }
        }

        this.sendGameState(game);
    }

    onGameMessage(socket, command, ...args) {
        let game = this.findGameForUser(socket.user.username);
        if(!game) {
            return;
        }

        if(command === 'leavegame') {
            return this.onLeaveGame(socket);
        }

        if(!game[command] || !_.isFunction(game[command])) {
            return;
        }

        this.runAndCatchErrors(game, () => {
            game[command](socket.user.username, ...args);

            game.continue();

            this.sendGameState(game);
        });
    }

    // zMQ EVENTS
    onStartGame(pendingGame) {
        let game = new Game(pendingGame, {
            router: this
        });

        this.games[pendingGame.id] = game;

        game.started = true;
        _.each(pendingGame.players, player => {
            game.selectLineup(player.name, player.lineup);
        });

        game.initialise();
    }

    onLeaveGame(socket) {
        let game = this.findGameForUser(socket.user.username);
        if(!game) {
            return;
        }

        let player = game.getPlayerOrSpectator(socket.user.username);
        let isSpectator = player.isSpectator();

        game.leave(socket.user.username);

        this.zmqSocket.send('PLAYERLEFT', {
            gameId: game.id,
            game: game.getSaveState(),
            player: socket.user.username,
            spectator: isSpectator
        });

        socket.send('cleargamestate');
        socket.leaveChannel(game.id);

        if(game.isEmpty()) {
            delete this.games[game.id];

            this.zmqSocket.send('GAMECLOSED', {game: game.id});
        }

        this.sendGameState(game);
    }

    onSpectator(pendingGame, user) {
        let game = this.games[pendingGame.id];
        if(!game) {
            return;
        }

        game.watch('TBA', user);

        this.sendGameState(game);
    }

    onGameSync(callback) {
        let gameSummaries = _.map(this.games, game => {
            let retGame = game.getSummary();

            return retGame;
        });

        logger.info(`syncing ${gameSummaries.length} games`);
        callback(gameSummaries);
    }
}

module.exports = GameServer;
