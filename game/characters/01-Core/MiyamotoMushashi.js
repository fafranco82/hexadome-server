const BaseCharacter = require('../../BaseCharacter');

const { DieColors, Symbols } = require('../../Constants');

class MiyamotoMushashi extends BaseCharacter {
	setupCardAbilities(abilities) {
		this.switch({
			id: 'success',
			symbols: [Symbols.Block]
		});

		this.attack({
			id: 'ken-no-sen',
			points: 3,
			dice: [DieColors.Red, DieColors.Orange, DieColors.Blue],
			range: [1, 1],
			switches: {
				id: 'repeat',
				symbols: [Symbols.Block, Symbols.Special, Symbols.Special]
			}
		});
	}
}

MiyamotoMushashi.id = 'miyamoto-mushashi';

module.exports = MiyamotoMushashi;