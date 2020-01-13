const EventEmitter = require('events');
const zmq = require('zeromq');
const config = require('config');
const logger = require('../logger');

class ZmqSocket extends EventEmitter {
    constructor(listenAddress, protocol, version) {
        super();

        this.listenAddress = listenAddress;
        this.protocol = protocol;
        this.version = version;

        this.socket = zmq.socket('dealer');
        this.socket.identity = process.env.SERVER || config.get('gamenode.identity');
        this.socket.monitor(500, 0);

        this.socket.connect(config.get('router.url'), err => {
            if(err) {
                logger.error(err);
            } else {
                logger.info(`gamenode ${this.socket.identity} listening on ${config.get('router.url')}`);
            }
        });

        this.socket.on('connect', this.onConnect.bind(this));
        this.socket.on('message', this.onMessage.bind(this));
    }

    send(command, arg) {
        this.socket.send(JSON.stringify({command, arg}));
    }

    //EVENTS
    onConnect() {
        this.emit('onGameSync', this.onGameSync.bind(this));
    }

    onGameSync(games) {
        this.send('HELLO', {
            maxGames: config.has('gamenode.maxGames') ? config.get('gamenode.maxGames') : 20,
            version: this.version,
            address: this.listenAddress,
            port: process.env.NODE_ENV  === 'production' ? 80 : (process.env.PORT || config.get('gamenode.socketio.port')),
            protocol: this.protocol,
            games: games
        });
    }

    onMessage(x, msg) {
        let message = undefined;

        try {
            message = JSON.parse(msg.toString());
        } catch (err) {
            logger.error(err);
            return;
        }

        switch(message.command) {
        case 'PING':
            this.send('PONG');
            break;
        case 'STARTGAME':
            this.emit('onStartGame', message.arg);
            break;
        case 'SPECTATOR':
            this.emit('onSpectator', message.arg.game, message.arg.user);
            break;
        }
    }
}

module.exports = ZmqSocket;
