const BaseCharacter = require('../../BaseCharacter');

const { DieColors, Symbols, States } = require('../../Constants');

class Parvati extends BaseCharacter {
	setupCardAbilities(abilities) {
		this.switch({
			id: 'receive',
			symbols: [Symbols.Special],
			gameAction: abilities.actions.imposeState({
				target: this,
				state: States.PlusInitiative
			})
		});

		this.attack({
			id: 'submachine-guns',
			points: 2,
			dice: [DieColors.Orange, DieColors.Orange, DieColors.Yellow],
			range: [2, 6]
		});

		this.action({
			id: 'reset',
			points: 2,
			dice: [DieColors.Orange, DieColors.Yellow],
			range: [0, 5]
		});

		this.action({
			id: 'medikit',
			points: 1,
			dice: [DieColors.Orange],
			range: [0, 5]
		});
	}
}

Parvati.id = 'parvati';

module.exports = Parvati;