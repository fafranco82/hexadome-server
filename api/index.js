const account = require('./account');
const characters = require('./characters');

module.exports.init = function(server) {
    account.init(server);
    characters.init(server);
};
