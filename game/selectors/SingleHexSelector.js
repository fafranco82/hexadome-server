const BaseHexSelector = require('./BaseHexSelector');

class SingleHexSelector extends BaseHexSelector {
    constructor(properties) {
        super(properties);

        this.numHexes = 1;
    }

    automaticFireOnSelect() {
        return true;
    }

    hasReachedLimit(selectedHexes) {
        return selectedHexes.length >= this.numHexes;
    }

    hasExceededLimit(selectedHexes) {
        return selectedHexes.length > this.numHexes;
    }

    formatSelectParam(hexes) {
        return hexes[0] ? hexes[0] : hexes;
    }
}

module.exports = SingleHexSelector;
