const _ = require('lodash');

const UiPrompt = require('../../prompt/UiPrompt');

const { EventNames } = require('../../../Constants');

class CharacterActionStepWindow extends UiPrompt {
	constructor(game, activeCharacter) {
		super(game, activeCharacter.owner);

		this.activeCharacter = activeCharacter;
		this.currentPlayer = this.activeCharacter.owner;

		this.legalActions = [];
		this.validDestinations = [];
	}

	activeCondition(player) {
		return this.currentPlayer === player;
	}

	continue() {
        if(!this.isCompleted()) {
            this.collectLegalCharacterActions();
            this.highlightHexes();
        }

        return super.continue();
    }

    collectLegalCharacterActions() {
    	this.legalActions = this.activeCharacter.getActions().filter(action => action.meetsRequirements(action.createContext(this.currentPlayer)) === '');
    }

    highlightHexes() {
    	if(this.activeCharacter.movementPoints >= 1) {
	    	let destinations = this.game.gameBoard.getDestinationsFrom(this.activeCharacter.position);
	    	this.currentPlayer.setSelectableHexes(destinations);
	    	this.validDestinations = destinations.map(d => `${d.x},${d.y}`);
	    } else {
	    	this.currentPlayer.clearSelectableHexes();
	    }
    }

	activePrompt() {
		return {
			promptTitle: {
				message: 'game.phases.turns.activation.titles.prompt',
				args: {
					player: this.currentPlayer,
					character: this.activeCharacter
				}
			},
			menuTitle: 'game.phases.turns.activation.titles.active',
			buttons: _.map(this.legalActions, (action, index) => {
				let args = action.properties.titleArgs || ((context) => _.pick(context, ['player', 'source', 'target']));
				if(typeof args === 'function') {
                    args = args(action.createContext(this.currentPlayer));
                }
				return {
					arg: ['action', index],
					text: {
	                    message: action.title,
	                    args: args
	                }
				};
			}).concat([{ arg: 'pass', text: {message: 'game.prompts.common.buttons.pass'} }])
		};
	}

	waitingPrompt() {
		return {
			promptTitle: {
				message: 'game.phases.turns.activation.titles.prompt',
				args: {
					player: this.currentPlayer,
					character: this.activeCharacter
				}
			},
			menuTitle: 'game.phases.turns.activation.titles.waiting'
		};
	}

	onMenuCommand(player, choice, index) {
		if(!this.activeCondition(player)) {
			return false;
		}

		if(choice === 'action') {
			let action = this.legalActions[index];
			if(action) {
				this.currentPlayer.clearSelectableHexes();
				this.game.resolveAction(action.createContext(this.currentPlayer));
				return true;
			}
		}

		if(choice === 'pass') {
			this.pass();
			return true;
		}
	}

	onHexClicked(player, position) {
		if(!player || !this.activeCondition(player) || !_.includes(this.validDestinations, `${position.x},${position.y}`)) {
			return false;
		}

		this.currentPlayer.movePiece(this.activeCharacter, position);
		this.activeCharacter.movementPoints -= 1;
	}

	pass() {
		this.currentPlayer.clearSelectableHexes();
		this.complete();
	}
}

module.exports = CharacterActionStepWindow;
