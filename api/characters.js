const CharacterService = require('../services/CharacterService');

let characterService = new CharacterService();

module.exports.init = function(server) {

    server.get('/characters', (req, res, next) => {
        characterService.getCharacters().then(characters => {
            res.send({success: true, characters: characters});
        }).catch(err => {
            return next(err);
        });
    });

};
