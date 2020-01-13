const BaseCharacter = require('../../BaseCharacter');

const { DieColors, Symbols, States } = require('../../Constants');

class MajorLunah extends BaseCharacter {
	setupCardAbilities(abilities) {
		this.attack({
			id: 'called-shot',
			points: 3,
			dice: [DieColors.Red, DieColors.Orange, Symbols.Success],
			range: [3, 8]
		});

		this.action({
			id: 'suppressive-fire',
			points: 2,
			dice: [DieColors.Orange, DieColors.Yellow],
			range: [3, 8],
			switches: {
				id: 'inflict',
				symbols: [Symbols.Block, Symbols.Special]
			},
			effect: {
				gameAction: abilities.actions.imposeState({state: States.MinusSpeed})
			}
		});
	}
}

MajorLunah.id = 'major-lunah';

module.exports = MajorLunah;