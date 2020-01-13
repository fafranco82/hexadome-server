const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const monk = require('monk');

const config = require('config');
const Socket = require('./Socket');
const logger = require('./logger');

const PendingGame = require('./PendingGame');
const GameRouter = require('./GameRouter');

const UserService = require('./services/UserService.js');
const CharacterService = require('./services/CharacterService.js');

class Lobby {
    constructor(server, options = {}) {
        this.sockets = {};
        this.users = {};
        this.games = {};

        this.db = options.db || monk(config.get('database.url'));
        this.router = options.router || new GameRouter();
        this.router.on('onPlayerLeft', this.onPlayerLeft.bind(this));
        this.router.on('onGameClosed', this.onGameClosed.bind(this));
        this.router.on('onWorkerTimedOut', this.onWorkerTimedOut.bind(this));
        this.router.on('onNodeReconnected', this.onNodeReconnected.bind(this));
        this.router.on('onWorkerStarted', this.onWorkerStarted.bind(this));

        this.userService = options.userService || new UserService(this.db);
        this.characterService = options.characterService || new CharacterService(this.db);

        // Socket.IO stuff
        this.io = options.io || socketio(server, {perMessageDeflate: false});
        this.io.set('heartbeat timeout', 30000);
        this.io.use(this.handshake.bind(this));
        this.io.on('connection', this.onConnection.bind(this));

        setInterval(() => this.clearStalePendingGames(), 60 * 1000);
    }

    getUserList() {
        let userList = _.map(this.users, function(user) {
            return user.getShortSummary();
        });

        userList = _.sortBy(userList, user => {
            return user.username.toLowerCase();
        });

        return userList;
    }

    findGameForUser(username) {
        return _.find(this.games, game => {
            if(game.spectators[username]) {
                return true;
            }

            let player = game.players[username];

            if(!player || player.left) {
                return false;
            }

            return true;
        });
    }

    broadcastUserList() {
        // TODO: debounce function

        let users = this.getUserList();

        _.each(this.sockets, socket => {
            this.sendUserListFilteredWithBlockList(socket, users);
        });
    }

    sendUserListFilteredWithBlockList(socket, userList) {
        let filteredUsers = userList;

        if(socket.user) {
            filteredUsers = _.reject(userList, user => {
                //return _.contains(socket.user.blockList, user.name.toLowerCase());
                // TODO blocklist
                return !user;
            });
        }

        socket.send('users', filteredUsers);
    }

    sendGameState(game) {
        if(game.started) {
            return;
        }

        _.each(game.getPlayersAndSpectators(), player => {
            if(!this.sockets[player.id]) {
                logger.error(`Wanted to send to ${player.id} but have no sockets`);
                return;
            }

            this.sockets[player.id].send('gamestate', game.getSummary(player.name));
        });
    }

    broadcastGameList(socket) {
        let sockets = socket ? [socket] : this.sockets;
        _.each(sockets, socket => {
            let filteredGames = this.filterGameListWithBlockList(socket.user);
            let gameSummaries = this.mapGamesToGameSummaries(filteredGames);
            socket.send('games', gameSummaries);
        });
    }

    filterGameListWithBlockList(user) {
        if(!user) {
            return this.games;
        }

        return _.filter(this.games, game => {
            // TODO blocklist
            return !!game;
        });
    }

    mapGamesToGameSummaries(games) {
        return _.chain(games)
            .map(game => game.getSummary())
            .sortBy('createdAt')
            .sortBy('started')
            .reverse()
            .value();
    }

    handshake(ioSocket, next) {
        //var versionInfo = undefined;

        if(ioSocket.handshake.query.token && ioSocket.handshake.query.token !== 'undefined') {
            jwt.verify(ioSocket.handshake.query.token, config.get('jwt.secret'), (err, user) => {
                if(err) {
                    ioSocket.emit('authfailed'); // TODO token expiration
                    logger.error(err);
                    return;
                }

                this.userService.getUserById(user._id).then(dbUser => {
                    let socket = this.sockets[ioSocket.id];
                    if(!socket) {
                        logger.error(`Tried to authenticate socket but could not find it: ${dbUser.username}`);
                        return;
                    }

                    ioSocket.request.user = dbUser.getWireSafeDetails();
                    socket.user = dbUser;
                    this.users[dbUser.username] = dbUser;

                    this.doPostAuth(socket);
                }).catch(err => {
                    logger.error(err);
                });
            });
        }

        /* TODO: revisar control de version del socket
        if(ioSocket.handshake.query.version) {
            versionInfo = moment(ioSocket.handshake.query.version);
        }

        if(!versionInfo || versionInfo < version) {
            ioSocket.emit('banner', 'Your client version is out of date, please refresh or clean up your cache to get the latest version');
        }
        */

        next();
    }

    clearGamesForNode(nodeName) {
        _.each(this.games, game => {
            if(game.node && game.node.identity === nodeName) {
                delete this.games[game.id];
            }
        });

        this.broadcastGameList();
    }

    clearStalePendingGames() {
        const timeout = 15 * 60 * 1000;
        let staleGames = _.filter(this.games, game => !game.started && Date.now() - game.createdAt > timeout);
        for(let game of staleGames) {
            logger.info(`closed pending game ${game.id} due to inactivity`);
            delete this.games[game.id];
        }

        if(staleGames.length > 0) {
            this.broadcastGameList();
        }
    }

    sendHandoff(socket, gameNode, gameId) {
        let authToken = jwt.sign(socket.user.getWireSafeDetails(), config.get('jwt.secret'), {
            expiresIn: '5m'
        });

        socket.send('handoff', {
            address: gameNode.address,
            port: gameNode.port,
            protocol: gameNode.protocol,
            name: gameNode.identity,
            authToken: authToken,
            gameId: gameId
        });
    }

    // LOBBY SOCKET EVENTS
    onConnection(ioSocket) {
        let socket = new Socket(ioSocket);

        socket.registerEvent('newgame', this.onNewGame.bind(this));
        socket.registerEvent('joingame', this.onJoinGame.bind(this));
        socket.registerEvent('startgame', this.onStartGame.bind(this));
        socket.registerEvent('watchgame', this.onWatchGame.bind(this));
        socket.registerEvent('leavegame', this.onLeaveGame.bind(this));
        socket.registerEvent('gamechat', this.onPendingGameChat.bind(this));

        socket.on('authenticate', this.onAuthenticate.bind(this));
        socket.on('disconnect', this.onSocketDisconnected.bind(this));

        this.sockets[ioSocket.id] = socket;

        if(socket.user) {
            // TODO: default options
            this.users[socket.user.username] = socket.user;

            this.broadcastUserList();
        } else {
            logger.info('anonymous user connected to lobby');
        }

        // Force user list send for the newly connected socket, bypassing the throttle
        this.sendUserListFilteredWithBlockList(socket, this.getUserList());
        //this.sendFilteredMessages(socket);
        this.broadcastGameList(socket);

        if(!socket.user) {
            return;
        }

        let game = this.findGameForUser(socket.user.username);
        if(game && game.started) {
            this.sendHandoff(socket, game.node, game.id);
        }
    }

    onAuthenticate(socket, user) {
        this.userService.getUserById(user._id).then(dbUser => {
            this.users[dbUser.username] = dbUser;
            socket.user = dbUser;

            this.doPostAuth(socket);
        }).catch(err => {
            logger.error(err);
        });
    }

    doPostAuth(socket) {
        let user = socket.user;

        if(!user) {
            return;
        }

        this.broadcastUserList();
        //this.sendFilteredMessages(socket);
        this.sendUserListFilteredWithBlockList(socket, this.getUserList());

        logger.info(`User ${user.username} authenticated`);

        let game = this.findGameForUser(user.username);
        if(game && game.started) {
            this.sendHandoff(socket, game.node, game.id);
        }
    }

    onSocketDisconnected(socket, reason) {
        if(!socket) {
            return;
        }

        delete this.sockets[socket.id];

        if(!socket.user) {
            logger.info('anonymous disconnected from lobby');
            return;
        }

        delete this.users[socket.user.username];

        logger.info(`user ${socket.user.username} disconnected from lobby: ${reason}`);

        this.broadcastUserList();

        let game = this.findGameForUser(socket.user.username);
        if(!game) {
            return;
        }

        game.disconnect(socket.user.username);

        if(game.isEmpty()) {
            delete this.games[game.id];
        } else {
            this.sendGameState(game);
        }

        this.broadcastGameList();
    }

    onNewGame(socket, gameDetails) {
        let existingGame = this.findGameForUser(socket.user.username);
        if(existingGame) {
            return;
        }

        let game = new PendingGame(socket.user.getDetails(), gameDetails);
        game.newGame(socket.id, socket.user.getDetails(), gameDetails.password);

        socket.joinChannel(game.id);
        this.sendGameState(game);

        this.games[game.id] = game;
        this.broadcastGameList();


        this.onSelectLineup(socket, game.id, 1);

        /*
        Promise.all([
            this.cardService.getCards(),
            this.villainService.getById(gameDetails.villain.id),
            this.modularService.getById(gameDetails.modular.id)
        ]).then(results => {
            let [cards, villain, modular] = results;

            gameDetails.villain = this.formatVillainAsFullCards(gameDetails.villain, cards);
            gameDetails.mode = this.formatModeAsFullCards(gameDetails.mode, cards);
            gameDetails.modular = this.formatModularAsFullCards(gameDetails.modular, cards);

            let game = new PendingGame(socket.user.getDetails(), gameDetails);
            game.newGame(socket.id, socket.user.getDetails(), gameDetails.password);

            socket.joinChannel(game.id);
            this.sendGameState(game);

            this.games[game.id] = game;
            this.broadcastGameList();
        }).catch(err => {
            logger.error(`Error creating game: ${err}`);
            return;
        });
        */
    }

    onJoinGame(socket, gameId, password) {
        let existingGame = this.findGameForUser(socket.user.username);
        if(existingGame) {
            return;
        }

        let game = this.games[gameId];
        if(!game) {
            return;
        }

        let message = game.join(socket.id, socket.user.getDetails(), password);
        if(message) {
            // TODO
        }

        socket.joinChannel(game.id);
        this.onSelectLineup(socket, gameId, 1);

        this.sendGameState(game);
        this.broadcastGameList();
    }

    onStartGame(socket, gameId) {
        let game = this.games[gameId];

        if(!game || game.started) {
            return;
        }

        /*if(_.some(game.getPlayers(), player => !player.deck)) {
            return;
        }*/

        if(!game.isOwner(socket.user.username)) {
            return;
        }

        let gameNode = this.router.startGame(game);
        if(!gameNode) {
            return;
        }

        game.node = gameNode;
        game.started = true;

        this.broadcastGameList();

        _.each(game.getPlayersAndSpectators(), player => {
            let socket = this.sockets[player.id];

            if(!socket || !socket.user) {
                logger.error(`Wanted to handoff to ${player.name}, but couldn't find a socket`);
                return;
            }

            this.sendHandoff(socket, gameNode, game.id);
        });
    }

    onWatchGame(socket, gameId, password) {
        let existingGame = this.findGameForUser(socket.user.username);
        if(existingGame) {
            return;
        }

        let game = this.games[gameId];
        if(!game) {
            return;
        }

        let message = game.watch(socket.id, socket.user.getDetails(), password);
        if(message) {
            // TODO
        }

        socket.joinChannel(game.id);

        if(game.started) {
            this.router.addSpectator(game, socket.user.getDetails());
            this.sendHandoff(socket, game.node, game.id);
        } else {
            this.sendGameState(game);
        }
    }

    onLeaveGame(socket) {
        let game = this.findGameForUser(socket.user.username);
        if(!game)
            return;

        game.leave(socket.user.username);
        socket.send('cleargamestate');
        socket.leaveChannel(game.id);

        if(game.isEmpty()) {
            delete this.games[game.id];
        } else {
            this.sendGameState(game);
        }

        this.broadcastGameList();
    }

    onSelectLineup(socket, gameId, lineupId) {
        let game = this.games[gameId];
        if(!game) {
            return;
        }

        Promise.all([this.characterService.getCharacters()]).then(results => {
            let [characters] = results;
            let lineup = _.keys(characters);

            let formattedLineup = this.formatLineupAsFullInfo(lineup, characters);
            game.selectLineup(socket.user.username, formattedLineup);
            this.sendGameState(game);
        }).catch(err => {
            logger.error(`Error selecting lineup: ${err}`);
        });
    }

    formatLineupAsFullInfo(lineup, characters) {
        return _.map(lineup, c => characters[c]);
    }

    onPendingGameChat(socket, message) {
        let game = this.findGameForUser(socket.user.username);

        if(!game) {
            return;
        }

        game.chat(socket.user.username, message);
        this.sendGameState(game);
    }

    // GAME ROUTER EVENTS
    onPlayerLeft(gameId, player) {
        let game = this.games[gameId];

        if(!game) {
            return;
        }

        game.leave(player);

        if(game.isEmpty()) {
            delete this.games[gameId];
        }

        this.broadcastGameList();
    }

    onGameClosed(gameId) {
        let game = this.games[gameId];

        if(!game) {
            return;
        }

        delete this.games[gameId];

        this.broadcastGameList();
    }

    onWorkerTimedOut(nodeName) {
        this.clearGamesForNode(nodeName);
    }

    onWorkerStarted(nodeName) { // eslint-disable-line no-unused-vars
        //this.router.sendCommand(nodeName, 'CARDDATA', { /* card data */});
    }

    onNodeReconnected(nodeName, games) {
        _.each(games, game => {
            let owner = game.players[game.owner];

            if(!owner) {
                logger.error(`Got a game where the owner wasn't a player: ${game.owner}`);
                return;
            }

            let syncGame = new PendingGame({
                username: owner.user
            }, {
                allowSpectators: game.allowSpectators,
                name: game.name
            });
            syncGame.id = game.id;
            syncGame.node = this.router.workers[nodeName];
            syncGame.createdAt = game.startedAt;
            syncGame.started = game.started;
            syncGame.gameType = game.gameType;
            syncGame.password = game.password;

            _.each(game.players, player => {
                syncGame.players[player.name] = _.pick(player, [
                    'id', 'name', 'gravatar', 'owner', 'user'
                ]);
            });

            _.each(game.spectators, player => {
                syncGame.spectators[player.name] = _.pick(player, [
                    'id', 'name', 'gravatar', 'user'
                ]);
            });

            this.games[syncGame.id] = syncGame;
        });

        _.each(this.games, game => {
            if(game.node && game.node.identity === nodeName && _.find(games, nodeGame => {
                return nodeGame.id === game.id;
            })) {
                this.games[game.id] = game;
            } else if (game.node && game.node.identity === nodeName) {
                delete this.games[game.id];
            }
        });

        this.broadcastGameList();
    }
}

module.exports = Lobby;
