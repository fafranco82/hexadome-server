const BaseCharacter = require('../../BaseCharacter');

const { DieColors, Symbols, States } = require('../../Constants');

class WildBill extends BaseCharacter {
	setupCardAbilities(abilities) {
		this.switch({
			id: 'draw',
			symbols: [Symbols.Block, Symbols.Block]
		});

		this.attack({
			id: 'twin-pistols',
			points: 3,
			dice: [DieColors.Red, DieColors.Orange, DieColors.Orange, Symbols.Success],
			range: [2, 6],
			switches: {
				id: 'repeat',
				symbols: [Symbols.Special, Symbols.Special, Symbols.Special]
			}
		});
	}
}

WildBill.id = 'wild-bill';

module.exports = WildBill;