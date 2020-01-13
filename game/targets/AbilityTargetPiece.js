const _ = require('lodash');

const PieceSelector = require('../PieceSelector');

const { Players, Stages } = require('../Constants');

class AbilityTargetPiece {
	constructor(name, properties, ability) {
		this.name = name;
		this.properties = properties;

		this.selector = this.getSelector(properties);
	}

	getSelector(properties) {
        let pieceCondition = (piece, context) => {
            let contextCopy = this.getContextCopy(piece, context);
            if(context.stage === Stages.PreTarget && this.dependentCost && !this.dependentCost.canPay(contextCopy)) {
                return false;
            }
            return (!properties.pieceCondition || properties.pieceCondition(piece, contextCopy)) &&
                   (!this.dependentTarget || this.dependentTarget.hasLegalTarget(contextCopy)) &&
                   (properties.gameAction.length === 0 || properties.gameAction.some(gameAction => gameAction.hasLegalTarget(contextCopy)));
        };
        return PieceSelector.for(Object.assign({}, properties, { pieceCondition: pieceCondition }));
    }

    getContextCopy(piece, context) {
        let contextCopy = context.copy();
        contextCopy.targets[this.name] = piece;
        if(this.name === 'target') {
            contextCopy.target = piece;
        }
        return contextCopy;
    }

	canResolve(context) {
		return this.hasLegalTarget(context);
	}

	hasLegalTarget(context) {
		return this.selector.optional || this.selector.hasEnoughTargets(context, this.getChoosingPlayer(context));
	}

	getChoosingPlayer(context) {
		let playerProp = this.properties.player;
		if(typeof playerProp === 'function') {
			playerProp = playerProp(context);
		}
		return playerProp === Players.Opponent ? context.player.opponent : context.player;
	}

	resolve(context, targetResults) {
		if(targetResults.cancelled) {
			return;
		}

		let player = context.choosingPlayerOverride || this.getChoosingPlayer(context);		

		let otherProperties = _.omit(this.properties, ['pieceCondition', 'player']);
		
		let promptProperties = {
			waitingPromptTitle: 'game.prompts.common.titles.waiting',
			context: context,
			selector: this.selector,
			onSelect: (player, piece) => {
				context.targets[this.name] = piece;
				if(this.name === 'target') {
					context.target = piece;
				}
				return true;
			},
			onCancel: () => {
				targetResults.cancelled = true;
				return true;
			}
		};

		context.game.promptForSelectPiece(player, Object.assign(promptProperties, otherProperties));
	}
}

module.exports = AbilityTargetPiece;
