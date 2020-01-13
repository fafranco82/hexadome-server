const _ = require('lodash');

const PieceGameAction = require('./PieceGameAction');

const { EventNames, States } = require('../Constants');

class ImposeStateAction extends PieceGameAction {
	constructor(propertyFactory) {
		super(propertyFactory);

		this.name = 'imposeState';
		this.eventName = EventNames.OnStateImposed;
	}

	getDefaultProperties() {
		return Object.assign(super.getDefaultProperties(), {
			state: States.Unnamed
		});
	}

	addPropertiesToEvent(event, piece, context, additionalProperties = {}) {
		let properties = this.getProperties(context, additionalProperties);
        super.addPropertiesToEvent(event, piece, context, additionalProperties);
        event.state = properties.state;
    }

    eventHandler(event) {
        event.context.game.addMessage(`[i18n] [[player]] imposes the state ${event.state} to [[target]]`, {
        	player: event.player,
        	target: event.piece
        });
        event.piece.imposeState(event.state);
    }
}

module.exports = ImposeStateAction;
