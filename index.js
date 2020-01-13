const Server = require('./Server');
const Lobby = require('./Lobby');

function runServer() {
    let server = new Server(process.env.NODE_ENV !== 'production');
    let httpServer = server.init();
    let lobby = new Lobby(httpServer); // eslint-disable-line no-unused-vars

    server.run();
}

runServer();
