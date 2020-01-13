const BasePieceSelector = require('./BasePieceSelector');

class UpToXPieceSelector extends BasePieceSelector {
    constructor(numPieces, properties) {
        super(properties);

        this.numPieces = numPieces;
    }

    /*
    defaultActivePromptTitle() {
        if(this.numPieces === 1) {
            return 'game.prompts.select.titles.active.choosecard';
        } else {
            return `[i18n] Select ${this.numPieces} characters`;
        }
    }
    */

    hasReachedLimit(selectedPieces) {
        return selectedPieces.length >= this.numPieces;
    }

    hasExceededLimit(selectedPieces) {
        return selectedPieces.length > this.numPieces;
    }
}

module.exports = UpToXPieceSelector;
