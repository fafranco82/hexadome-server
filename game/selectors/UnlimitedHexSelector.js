const BaseHexSelector = require('./BaseHexSelector');

class UnlimitedHexSelector extends BaseHexSelector {
    hasReachedLimit() {
        return false;
    }
}

module.exports = UnlimitedHexSelector;
