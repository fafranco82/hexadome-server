const BaseCharacter = require('../../BaseCharacter');

const { States, DieColors, Symbols } = require('../../Constants');

class Hexx3r extends BaseCharacter {
	setupCardAbilities(abilities) {
		this.switch({
			id: 'displace',
			symbols: [Symbols.Block, Symbols.Special],
			gameAction: abilities.actions.displace({target: this})
		});

		this.action({
			id: 'gotcha',
			points: 2,
			dice: [DieColors.Yellow, DieColors.Yellow],
			range: [1, 3],
			switches: {
				id: 'impose',
				symbols: [Symbols.Block, Symbols.Special],
				gameAction: abilities.actions.imposeState({state: States.MinusSpeed})
			},
			effect: {
				gameAction: abilities.actions.imposeState({state: States.Immobilized})
			}
		});

		this.action({
			id: 'vade-retro',
			points: 1,
			dice: [DieColors.Yellow, DieColors.Yellow, DieColors.Yellow],
			range: [1, 4],
			effect: {
				gameAction: abilities.actions.displace()
			}
		});
	}
}

Hexx3r.id = 'hexx3r';

module.exports = Hexx3r;