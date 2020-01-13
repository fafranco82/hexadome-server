const BasePieceSelector = require('./BasePieceSelector');

class SinglePieceSelector extends BasePieceSelector {
    constructor(properties) {
        super(properties);

        this.numPieces = 1;
    }

    /*
    defaultActivePromptTitle() {
        if(this.pieceType.length === 1 && this.pieceType[0] !== PieceTypes.Any) {
            return {
                message: 'game.prompts.select.titles.active.choosetype',
                args: {
                    context: {
                        type: this.pieceType[0]
                    }
                }
            };
        }
        return 'game.prompts.select.titles.active.choosepiece';
    }
    */

    automaticFireOnSelect() {
        return true;
    }

    hasReachedLimit(selectedPieces) {
        return selectedPieces.length >= this.numPieces;
    }

    hasExceededLimit(selectedPieces) {
        return selectedPieces.length > this.numPieces;
    }

    formatSelectParam(pieces) {
        return pieces[0] ? pieces[0] : pieces;
    }
}

module.exports = SinglePieceSelector;
