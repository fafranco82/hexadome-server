const GameAction = require('./GameAction');

class PieceGameAction extends GameAction {
	constructor(propertyFactory) {
		super(propertyFactory);

		this.targetType = ['character', 'barrier'];
	}

	defaultTargets(context) {
		return [context.source];
	}

	addPropertiesToEvent(event, piece, context, additionalProperties = {}) {
		super.addPropertiesToEvent(event, piece, context, additionalProperties);
		event.piece = piece;
		event.player = context.player;
	}

	isEventFullyResolved(event, piece, context, additionalProperties = {}) {
		return event.piece === piece && super.isEventFullyResolved(event, piece, context, additionalProperties);
	}

	checkEventCondition(event, additionalProperties = {}) {
		return true;
	}
}

module.exports = PieceGameAction;
