const monk = require('monk');
const _ = require('lodash');

const config = require('config');
const logger = require('../logger');

class CharacterService {
    constructor(dbInstance) {
        let db = dbInstance || monk(config.get('database.url'));
        this.characters = db.get('characters');
    }

    getCharacters() {
        return this.characters.find({

        }).then(characters => {
            return _.keyBy(characters, 'id');
        }).catch(err => {
            logger.error(`Error fetching characters: ${err}`);

            throw new Error('Error fetching characters');
        });
    }

    replaceCharacters(characters) {
        return this.characters.remove({}).then(() => {
            this.characters.insert(characters);
        }).catch(err => {
            logger.error(`Error replacing characters: ${err}`);

            throw new Error('Error replacing characters');
        });
    }
}

module.exports = CharacterService;
