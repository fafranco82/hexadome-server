const BasePieceSelector = require('./BasePieceSelector');

class ExactlyXPieceSelector extends BasePieceSelector {
    constructor(numPieces, properties) {
        super(properties);

        this.numPieces = numPieces;
        this.partial = typeof properties.partial === 'undefined' ? true : !!properties.partial;
    }

    hasEnoughSelected(selectedPieces) {
        return selectedPieces.length === this.numPieces;
    }

    hasEnoughTargets(context, choosingPlayer) {
        let numMatchingPieces = context.game.allPieces.filter(piece => {
            return this.canTarget(piece, context, choosingPlayer);
        }).length;

        if(this.partial && numMatchingPieces < this.numPieces) {
            this.numPieces = numMatchingPieces;
        }

        return numMatchingPieces >= this.numPieces;
    }

    hasReachedLimit(selectedPieces) {
        return selectedPieces.length >= this.numPieces;
    }

    automaticFireOnSelect() {
        return this.numPieces === 1;
    }
}

module.exports = ExactlyXPieceSelector;
