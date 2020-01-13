const BaseHexSelector = require('./BaseHexSelector');

class UpToXHexSelector extends BaseHexSelector {
    constructor(numHexes, properties) {
        super(properties);

        this.numHexes = numHexes;
    }

    hasReachedLimit(selectedHexes) {
        return selectedHexes.length >= this.numHexes;
    }

    hasExceededLimit(selectedHexes) {
        return selectedHexes.length > this.numHexes;
    }
}

module.exports = UpToXHexSelector;
