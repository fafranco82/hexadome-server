const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const CharacterService = require('../../services/CharacterService');

class DataImport {
	constructor(dataSource, imageSource, imageDir, language) {
        this.dataSource = dataSource;
        this.imageSource = imageSource;
        this.imageDir = imageDir;
        this.language = language;

        this.characterService = new CharacterService();
    }

    async import() {
    	try {
            await this.importCharacters();
        } catch(e) {
            console.log('Unable to fetch data', e);
        } finally {
            setTimeout((() => process.exit()), 1000);
        }
    }

    async importCharacters() {
    	let characters = await this.dataSource.getCharacters();

    	await this.characterService.replaceCharacters(characters);

    	console.info(characters.length + ' characters fetched');

    	//await this.fetchImages(characters);
    }
}

module.exports = DataImport;
