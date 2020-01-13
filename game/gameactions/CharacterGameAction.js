const PieceGameAction = require('./PieceGameAction');

class CharacterGameAction extends PieceGameAction {
	constructor(propertyFactory) {
		super(propertyFactory);
	}

	addPropertiesToEvent(event, character, context, additionalProperties = {}) {
		super.addPropertiesToEvent(event, character, context, additionalProperties);
		event.character = character;
	}
}

module.exports = CharacterGameAction;
