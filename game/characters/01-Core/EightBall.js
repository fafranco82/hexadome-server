const BaseCharacter = require('../../BaseCharacter');

const { DieColors, Symbols } = require('../../Constants');

class EightBall extends BaseCharacter {
	setupCardAbilities(abilities) {
		this.switch({
			id: 'displace',
			symbols: [Symbols.Block, Symbols.Special],
			gameAction: abilities.actions.displace({target: this})
		});

		this.attack({
			id: 'eat-my-fa-jing',
			points: 2,
			dice: [DieColors.Orange, DieColors.Blue],
			range: [1, 3],
			switches: {
				id: 'displace',
				symbols: [Symbols.Special],
				gameAction: abilities.actions.displace()
			}
		});

		this.action({
			id: 'be-water-dude',
			points: 3,
			dice: [DieColors.Orange, DieColors.Blue],
			range: [1, 2],
			effect: {
				gameAction: abilities.actions.place({
					hexCondition: (hex, context) => context.game.gameBoard.areAdjacents(hex, context.source.position)
				})
			}
		});
	}
}

EightBall.id = '8-ball';

module.exports = EightBall;