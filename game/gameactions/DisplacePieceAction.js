const _ = require('lodash');

const PieceGameAction = require('./PieceGameAction');

const { EventNames, Players } = require('../Constants');

class DisplacePieceAction extends PieceGameAction {
	constructor(propertyFactory) {
		super(propertyFactory);

		this.name = 'displacePiece';
		this.eventName = EventNames.OnPiecePlaced;
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
				hexCondition: (hex, context) => context.game.gameBoard.areAdjacents(hex, target.position),
				onSelect: (player, hex) => {
					events.push(this.getEvent(target, context, {to: hex}));
					return true;
				}
			};
			let otherProperties = _.omit(properties, ['onSelect', 'hexCondition']);

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

module.exports = DisplacePieceAction;
