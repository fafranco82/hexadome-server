const GamePiece = require('./GamePiece');

class BlockedSpace extends GamePiece {
	constructor(game) {
		super('blocked', null, game);

		this.type = 'blocked';
	}

	blocksMovement() {
		return true;
	}

	blocksLineOfSight() {
		return true;
	}

	providesCover() {
		return true;
	}

	canBeTargeted() {
		return false;
	}
}

module.exports = BlockedSpace;
