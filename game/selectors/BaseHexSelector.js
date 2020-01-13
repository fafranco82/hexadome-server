const _ = require('lodash');

const { Players } = require('../Constants');

class BaseHexSelector {
	constructor(properties) {
		this.hexCondition = properties.hexCondition;
		this.othersCondition = properties.othersCondition || (() => true);

		this.free = _.has(properties, 'free') ? properties.free : true;

		this.optional= properties.optional;
	}

	findPossibleHexes(context) {
		return context.game.gameBoard.getHexes();
	}

	canTarget(hex, context, choosingPlayer) {
		if(!hex) {
			return false;
		}

		if(this.free && !context.game.gameBoard.isFree(hex)) {
			return false;
		}

		return this.hexCondition(hex, context);
	}

	getAllLegalTargets(context, choosingPlayer) {
        return this.findPossibleHexes(context).filter(hex => this.canTarget(hex, context, choosingPlayer));
    }

    hasEnoughSelected(selectedHexes) {
        return this.optional || selectedHexes.length > 0;
    }

    hasEnoughTargets(context, choosingPlayer) {
        return this.findPossibleHexes(context).some(hex => this.canTarget(hex, context, choosingPlayer));
    }

	checkWithOthers(hexes, hex) {
		return _.isEmpty(hexes) || this.othersCondition(hexes, hex);
	}

	defaultActivePromptTitle() {
        return '[i18n] Choose hex';
    }

	automaticFireOnSelect() {
        return false;
    }

	wouldExceedLimit(selectedHexes, hex) { // eslint-disable-line no-unused-vars
		return false;
	}

	hasReachedLimit(selectedHexes) { // eslint-disable-line no-unused-vars
        return false;
    }

    hasExceededLimit(selectedHexes) { // eslint-disable-line no-unused-vars
        return false;
    }

    formatSelectParam(hexes) {
        return hexes;
    }
}

module.exports = BaseHexSelector;
