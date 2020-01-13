const GamePiece = require('./GamePiece');

class Barrier extends GamePiece {
	constructor(game) {
		super('barrier', null, game);

		this.type = 'barrier';
	}

	blocksMovement() {
		return true;
	}

	providesCover() {
		return true;
	}
}

module.exports = Barrier;
