const _ = require('lodash');
const characters = require('./characters');

const BaseCharacter = require('./BaseCharacter');

class Lineup {
	constructor(data) {
		this.data = data;
	}

	prepare(player) {
		let result = {
			characters: []
		};

		_.each(this.data.chars, data => {
			let character = this.createCharacter(BaseCharacter, player, data);
			result.characters.push(character);
		});

		return result;
	}

	createCharacter(baseClass, player, data) {
		let characterClass = characters[data.id] || baseClass;
		let character = new characterClass(player, data);

		return character;
	}
}

module.exports = Lineup;
