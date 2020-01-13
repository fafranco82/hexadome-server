const _ = require('lodash');

const PieceGameAction = require('./PieceGameAction');

const { EventNames, Players } = require('../Constants');

class PlacePieceAction extends PieceGameAction {
	constructor(propertyFactory) {
		super(propertyFactory);

		this.name = 'placePiece';
		this.eventName = EventNames.OnPiecePlaced;
	}

	getDefaultProperties() {
		return Object.assign(super.getDefaultProperties(), {
			hexCondition: () => true
		});
	}

	addEventsToArray(events, context, additionalProperties = {}) {
		let properties = this.getProperties(context, additionalProperties);

		if(properties.player === Players.Opponent && !context.player.opponent) {
            return;
        }

        let player = properties.player === Players.Opponent ? context.player.opponent : context.player;

		_.each(properties.target, target => {
			let promptProperties = {
				context: context,
				activePromptTitle: '[i18n] choose place',
				onSelect: (player, hex) => {
					events.push(this.getEvent(target, context, {to: hex}));
					return true;
				}
			};
			let otherProperties = _.omit(properties, 'onSelect');

			context.game.promptForSelectHex(player, Object.assign(promptProperties, otherProperties));
		});
	}

	addPropertiesToEvent(event, piece, context, additionalProperties = {}) {
        super.addPropertiesToEvent(event, piece, context, additionalProperties);
        event.to = additionalProperties.to;
    }

    eventHandler(event) {
        event.context.game.gameBoard.placeAt(event.piece, event.to.x, event.to.y);
    }
}

module.exports = PlacePieceAction;
