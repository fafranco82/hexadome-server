const CharacterGameAction = require('./CharacterGameAction');

const { EventNames } = require('../Constants');

class AddMovementPointsAction extends CharacterGameAction {
	constructor(propertyFactory) {
		super(propertyFactory);

		this.name = 'addMovementPoints';
		this.eventName = EventNames.OnMovementPointsAdded;
	}

	getDefaultProperties() {
		return Object.assign(super.getDefaultProperties(), {
			amount: 1
		});
	}

	addPropertiesToEvent(event, character, context, additionalProperties = {}) {
		let { amount } = this.getProperties(context, additionalProperties);
		super.addPropertiesToEvent(event, character, context, additionalProperties);
		event.amount = amount;
	}

	eventHandler(event) {
		event.character.addMovementPoints(event.amount);
	}
}

module.exports = AddMovementPointsAction;