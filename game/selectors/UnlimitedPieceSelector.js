const BasePieceSelector = require('./BasePieceSelector');

class UnlimitedPieceSelector extends BasePieceSelector {
    hasReachedLimit() {
        return false;
    }
}

module.exports = UnlimitedPieceSelector;
