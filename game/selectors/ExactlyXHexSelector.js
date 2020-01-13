const BaseHexSelector = require('./BaseHexSelector');

class ExactlyXHexSelector extends BaseHexSelector {
    constructor(numHexes, properties) {
        super(properties);

        this.numHexes = numHexes;
        this.partial = typeof properties.partial === 'undefined' ? true : !!properties.partial;
    }

    hasEnoughSelected(selectedHexes) {
        return selectedHexes.length === this.numHexes;
    }

    hasEnoughTargets(context, choosingPlayer) {
        let numMatchingHexes = context.game.allHexes.filter(hex => {
            return this.canTarget(hex, context, choosingPlayer);
        }).length;

        if(this.partial && numMatchingHexes < this.numHexes) {
            this.numHexes = numMatchingHexes;
        }

        return numMatchingHexes >= this.numHexes;
    }

    hasReachedLimit(selectedHexes) {
        return selectedHexes.length >= this.numHexes;
    }

    automaticFireOnSelect() {
        return this.numHexes === 1;
    }
}

module.exports = ExactlyXHexSelector;
