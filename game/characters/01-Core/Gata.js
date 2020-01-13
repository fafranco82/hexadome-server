const BaseCharacter = require('../../BaseCharacter');

const { DieColors, Symbols, EffectTypes } = require('../../Constants');

class Gata extends BaseCharacter {
	setupCardAbilities(abilities) {
		this.switch({
			id: 'displace',
			symbols: [Symbols.Special, Symbols.Special],
			gameAction: abilities.actions.displace({target: this})
		});

		this.action({
			id: 'misdirection',
			points: 1,
			dice: [DieColors.Orange, DieColors.Yellow],
			range: [1, 1]
		});

		this.action({
			id: 'freerun',
			points: 0,
			range: [1, 1],
			effect: {
				type: EffectTypes.Automatic,
				cost: abilities.costs.movementPoints(1),
				gameAction: abilities.actions.place(context => ({
					target: this,
					hexCondition: (hex, context) => context.game.gameBoard.areAdjacents(hex, context.parentContext.target.position)
				}))
			}
		});
	}
}

Gata.id = 'gata';

module.exports = Gata;