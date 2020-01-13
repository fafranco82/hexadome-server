const _ = require('lodash');

const UiPrompt = require('./UiPrompt');
const PieceSelector = require('../../PieceSelector');

class SelectPiecePrompt extends UiPrompt {
	constructor(game, choosingPlayer, properties) {
		super(game);

		this.choosingPlayer = choosingPlayer;

		if (properties.context && properties.context.source) {
            properties.source = properties.context.source;
        }

        if(properties.source && !properties.waitingPromptTitle) {
            properties.waitingPromptTitle = {
                message: 'game.prompts.common.titles.waitingfor',
                args: {
                    source: properties.source
                }
            };
        }

        this.properties = properties;
        this.context = properties.context;

        this.selector = properties.selector || PieceSelector.for(this.properties);
        this.selectedPieces = [];

        this.savePreviouslySelectedPieces();
	}

	savePreviouslySelectedPieces() {
		this.previouslySelectedPieces = this.choosingPlayer.getSelectedPieces();
        this.choosingPlayer.clearSelectedPieces();
        this.choosingPlayer.setSelectedPieces(this.selectedPieces);
	}

	continue() {
        if(!this.isCompleted()) {
            this.highlightSelectablePieces();
        }

        return super.continue();
    }

    highlightSelectablePieces() {
        this.choosingPlayer.setSelectablePieces(this.selector.findPossiblePieces(this.context).filter(piece => this.checkPieceCondition(piece)));
    }

    activeCondition(player) {
        return player === this.choosingPlayer;
    }

    activePrompt() {
        let buttons = this.properties.buttons;
        
        if(!this.selector.automaticFireOnSelect() && this.selector.hasEnoughSelected(this.selectedCards) || this.selector.optional) {
            if(buttons.every(button => button.arg !== 'done')) {
                buttons = [{text: {message: 'game.prompts.common.buttons.done'}, arg: 'done'}].concat(buttons);
            }
        }

        let promptTitle = this.properties.promptTitle;
        if(!promptTitle) {
            promptTitle = this.properties.source ? {message: 'game.prompts.common.titles.source', args: {source: this.properties.source}}: undefined;
        }

        return {
        	selectPiece: true,
            menuTitle: this.properties.activePromptTitle || this.selector.defaultActivePromptTitle(),
            buttons: buttons,
            promptTitle: promptTitle
        };
    }

    waitingPrompt() {
        return {
            menuTitle: this.properties.waitingPromptTitle || 'game.prompts.common.titles.waiting'
        };
    }

    onPieceClicked(player, piece) {
        if(player !== this.choosingPlayer) {
            return false;
        }

        if(!this.checkPieceCondition(piece)) {
            return false;
        }

        if(!this.selectPiece(piece)) {
            return false;
        }

        if(this.selector.automaticFireOnSelect() && this.selector.hasReachedLimit(this.selectedPieces)) {
            this.fireOnSelect();
        }
    }

    onMenuCommand(player, arg) {
        if(!this.activeCondition(player)) {
            return false;
        }

        if(arg === 'cancel') {
            this.properties.onCancel(player);
            this.complete();
            return true;
        } else if (arg === 'done' && this.selector.hasEnoughSelected(this.selectedCards)) {
            return this.fireOnSelect();
        } else if (this.properties.onMenuCommand(player, arg)) {
            this.complete();
            return true;
        }
        return false;
    }

    checkPieceCondition(piece) {
        if(this.onlyMustSelectMayBeChosen && !this.properties.mustSelect.includes(piece)) {
            return false;
        } else if(this.selectedPieces.includes(piece)) {
            return true;
        }

        return (
            this.selector.canTarget(piece, this.context, this.choosingPlayer) &&
			this.selector.checkWithOthers(this.selectedPieces, piece) &&
			!this.selector.wouldExceedLimit(this.selectedPieces, piece)
        );
    }

    selectPiece(piece) {
    	if(this.selector.hasReachedLimit(this.selectedPieces) && !this.selectedPieces.includes(piece)) {
    		return false;
    	}

    	if(!this.selectedPieces.includes(piece)) {
    		this.selectedPieces.push(piece);
    	} else {
    		this.selectedPieces = _.reject(this.selectedPieces, p => p === piece);
    	}
    	this.choosingPlayer.setSelectedPieces(this.selectedPieces);

    	return true;
    }

    fireOnSelect() {
    	let pieceParam = this.selector.formatSelectParam(this.selectedPieces);
    	if(this.properties.onSelect(this.choosingPlayer, pieceParam)) {
    		this.complete();
    		return true;
    	}

    	this.clearSelection();
    	return false;
    }

    complete() {
    	this.clearSelection();
    	return super.complete();
    }

    clearSelection() {
    	this.selectedPieces = [];
    	this.choosingPlayer.clearSelectedPieces();
    	this.choosingPlayer.clearSelectablePieces();

    	this.choosingPlayer.setSelectedPieces(this.previouslySelectedPieces);
    }
}

module.exports = SelectPiecePrompt;
