const _ = require('lodash');
const fs = require('fs');
const path = require('path');

class JsonDataSource {
    constructor(directory) {
        let {characters} = this.loadPackFiles(directory);
        this.characters = characters;
    }

    loadPackFiles(directory) {
        let characters = [];

        let packsPath = path.join(directory, 'packs');
        for(let pack of fs.readdirSync(packsPath)) {
            let packPath = path.join(packsPath, pack);
            if(fs.statSync(packPath).isDirectory()) {
                for(let file of fs.readdirSync(path.join(packPath, 'characters'))) {
                    let cardSet = path.parse(file).name;
                    let character = JSON.parse(fs.readFileSync(path.join(packPath, 'characters', file)));
                    character.pack = pack;
                    characters.push(character);
                }
            }
        }

        return {
            characters: characters
        };
    }

    getCharacters() {
        return this.characters;
    }
}

module.exports = JsonDataSource;
