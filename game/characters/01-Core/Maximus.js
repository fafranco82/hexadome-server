const BaseCharacter = require('../../BaseCharacter');

const { DieColors, Symbols, States } = require('../../Constants');

class Maximus extends BaseCharacter {
	setupCardAbilities(abilities) {
		this.switch({
			id: 'taunt',
			symbols: [Symbols.Block, Symbols.Special],
			gameAction: abilities.actions.imposeState({
				state: States.Taunted
			})
		});

		this.attack({
			id: 'jotums-shield',
			points: 3,
			dice: [DieColors.Red, DieColors.Blue, DieColors.Black],
			range: [1, 1],
			switches: {
				id: 'displace',
				symbols: [Symbols.Special, Symbols.Special],
				gameAction: abilities.actions.displace()
			}
		});
	}
}

Maximus.id = 'maximus';

module.exports = Maximus;