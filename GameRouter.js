const zmq = require('zeromq');
const router = zmq.socket('router');
const EventEmitter = require('events');

const config = require('config');
const logger = require('./logger');

const GameService = require('./services/GameService');

class GameRouter extends EventEmitter {
    constructor(options = {}) {
        super();

        this.workers = {};
        this.gameService = options.gameService || new GameService();

        router.bind(config.get('router.url'), err => {
            if(err) {
                logger.error(err);
            } else {
                logger.info(`gamerouter listening on ${config.get('router.url')}...`);
            }
        });

        router.on('message', this.onMessage.bind(this));

        setInterval(this.checkTimeouts.bind(this), 1000 * 60);
    }

    // EXTERNAL METHODS
    startGame(game) {
        let node = this.getNextAvailableGameNode();

        if(!node) {
            logger.error('Could not find new node for game');
            return;
        }

        this.gameService.create(game.getSaveState());

        node.numGames++;

        this.sendCommand(node.identity, 'STARTGAME', game);
        return node;
    }

    addSpectator(game, user) {
        this.sendCommand(game.node.identity, 'SPECTATOR', {
            game: game,
            user: user
        });
    }

    getNextAvailableGameNode() {
        if(Object.values(this.workers).length === 0) {
            return undefined;
        }

        let returnedWorker = undefined;

        for(const worker of Object.values(this.workers)) {
            if(worker.numGames >= worker.maxGames || worker.disabled || worker.disconnected) {
                continue;
            }

            if(!returnedWorker || returnedWorker.numGames > worker.numGames) {
                returnedWorker = worker;
            }
        }

        return returnedWorker;
    }

    // EVENTS
    onMessage(identity, msg) {
        let identityStr = identity.toString();
        let worker = this.workers[identityStr];
        let message = undefined;

        //logger.info(`msg received from ${identityStr}: ${msg.toString()}`);

        try {
            message = JSON.parse(msg.toString());
        } catch(err) {
            logger.error(err);
            return;
        }

        if(worker && worker.disconnected) {
            logger.info(`Worker ${identityStr} came back`);
            worker.disconnected = false;
        }

        switch(message.command) {
        case 'HELLO':
            this.emit('onWorkerStarted', identityStr);

            if(this.workers[identityStr]) {
                logger.info(`Worker ${identityStr} was already known, presume reconnected`);
                this.workers[identityStr].disconnected =  false;
            }

            this.workers[identityStr] = {
                identity: identityStr,
                maxGames: message.arg.maxGames,
                numGames: 0,
                address: message.arg.address,
                port: message.arg.port,
                protocol: message.arg.protocol,
                version: message.arg.version
            };
            worker = this.workers[identityStr];

            this.emit('onNodeReconnected', identityStr, message.arg.games);

            worker.numGames = message.arg.games.length;

            break;

        case 'PONG':
            if(worker) {
                worker.pingSent = undefined;
            } else {
                logger.error('PONG received from unknown worker');
            }

            break;

        case 'GAMEWIN':
            this.gameService.update(message.arg.game);
            break;

        case 'GAMECLOSED':
            if(worker) {
                worker.numGames--;
            } else {
                logger.error(`Got close game for non existant worker ${identity}`);
            }

            this.emit('onGameClosed', message.arg.game);
            break;

        case 'PLAYERLEFT':
            if(!message.arg.spectator) {
                this.gameService.update(message.arg.game);
            }

            this.emit('onPlayerLeft', message.arg.gameId, message.arg.player);
            break;
        }

        if(worker) {
            worker.lastMessage = Date.now();
        }
    }

    // INTERNAL METHODS
    sendCommand(identity, command, arg) {
        router.send([identity, '', JSON.stringify({command, arg})]);
    }

    checkTimeouts() {
        let currentTime = Date.now();
        const pingTimeout = 1 * 60 * 1000;

        for(const worker of Object.values(this.workers)) {
            if(worker.pingSent && currentTime - worker.pingSent > pingTimeout) {
                logger.info(`worker ${worker.identity} timed out`);
                this.workers[worker.identity].disconnected = true;
                this.emit('onWorkerTimedOut', worker.identity);
            } else if(!worker.pingSent) {
                if(currentTime - worker.lastMessage > pingTimeout) {
                    worker.pingSent = currentTime;
                    this.sendCommand(worker.identity, 'PING');
                }
            }
        }
    }
}

module.exports = GameRouter;
