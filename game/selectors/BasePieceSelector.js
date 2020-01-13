const _ = require('lodash');

const { Players } = require('../Constants');

class BasePieceSelector {
	constructor(properties) {
		this.pieceCondition = properties.pieceCondition;
		this.range = properties.range;
		this.othersCondition = properties.othersCondition || (() => true);
		this.controller = properties.controller || Players.Any;

		this.optional= properties.optional;
	}

	findPossiblePieces(context) {
		if(this.controller === Players.Self)
			return context.game.allPieces.filter(piece => piece.owner === context.player);
		else if(this.controller === Players.NotSelf)
			return context.game.allPieces.filter(piece => piece.owner !== context.player);
		else if(this.controller === Players.Opponent)
			return context.game.allPieces.filter(piece => piece.owner === context.player.opponent);
		else if(this.controller === Players.NotOpponent)
			return context.game.allPieces.filter(piece => piece.owner !== context.player.opponent);
		else
			return context.game.allPieces
	}

	canTarget(piece, context, choosingPlayer) {
		if(!piece) {
			return false;
		}

		if(!piece.canBeTargeted()) {
			return false;
		}

		if(this.range) {
			if(!context.game.arePiecesAtRange(context.source, piece, this.range)) {
				return false;
			}

			if(!context.game.hasLineOfSight(context.source, piece)) {
				return false;
			}
		}

		return this.pieceCondition(piece, context);
	}

	getAllLegalTargets(context, choosingPlayer) {
        return this.findPossiblePieces(context).filter(piece => this.canTarget(piece, context, choosingPlayer));
    }

    hasEnoughSelected(selectedPieces) {
        return this.optional || selectedPieces.length > 0;
    }

    hasEnoughTargets(context, choosingPlayer) {
        return this.findPossiblePieces(context).some(piece => this.canTarget(piece, context, choosingPlayer));
    }

	checkWithOthers(pieces, piece) {
		return _.isEmpty(pieces) || this.othersCondition(pieces, piece);
	}

	defaultActivePromptTitle() {
        return '[i18n] Choose piece';
    }

	automaticFireOnSelect() {
        return false;
    }

	wouldExceedLimit(selectedPieces, piece) { // eslint-disable-line no-unused-vars
		return false;
	}

	hasReachedLimit(selectedPieces) { // eslint-disable-line no-unused-vars
        return false;
    }

    hasExceededLimit(selectedPieces) { // eslint-disable-line no-unused-vars
        return false;
    }

    formatSelectParam(pieces) {
        return pieces;
    }
}

module.exports = BasePieceSelector;
