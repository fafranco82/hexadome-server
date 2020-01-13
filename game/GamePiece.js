const _ = require('lodash');

const GameObject = require('./GameObject');

class GamePiece extends GameObject {
	constructor(name, owner, game) {
        super(game, name);

        this.owner = owner;
        this.type = 'piece';
    }

    placeAt(position) {
        let originalPosition = this.position;

        this.position = position;

        if(!originalPosition || originalPosition.x !== position.x || originalPosition.y !== position.y) {
            //update things after moving
        }
    }

    canBeTargeted() {
        return true;
    }

    blocksMovement() {
    	return false;
    }

    blocksLineOfSight() {
    	return false;
    }

    providesCover() {
    	return false;
    }

    // SUMMARY
    getSummary(activePlayer) {
        let selectionState = activePlayer.getPieceSelectionState(this);

        return Object.assign({
            type: this.type,
            uuid: this.uuid
        }, selectionState);
    }
}

module.exports = GamePiece;
