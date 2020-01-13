const _ = require('lodash');

const UiPrompt = require('./UiPrompt');
const HexSelector = require('../../HexSelector');

class SelectHexPrompt extends UiPrompt {
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

        this.selector = properties.selector || HexSelector.for(this.properties);
        this.selectedHexes = [];

        this.savePreviouslySelectedHexes();
	}

	savePreviouslySelectedHexes() {
		this.previouslySelectedHexes = this.choosingPlayer.getSelectedHexes();
        this.choosingPlayer.clearSelectedHexes();
        this.choosingPlayer.setSelectedHexes(this.selectedHexes);
	}

	continue() {
        if(!this.isCompleted()) {
            this.highlightSelectableHexes();
        }

        return super.continue();
    }

    highlightSelectableHexes() {
        this.choosingPlayer.setSelectableHexes(this.selector.findPossibleHexes(this.context).filter(hex => this.checkHexCondition(hex)));
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
        	selectHex: true,
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

    onHexClicked(player, position) {
        if(player !== this.choosingPlayer) {
            return false;
        }

        if(!this.checkHexCondition(position)) {
            return false;
        }

        if(!this.selectHex(position)) {
            return false;
        }

        if(this.selector.automaticFireOnSelect() && this.selector.hasReachedLimit(this.selectedHexes)) {
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

    includesHex(collection, hex) {
        return _.filter(collection, h => hex.x===h.x && hex.y===h.y).length > 0;
    }

    checkHexCondition(hex) {
        if(this.onlyMustSelectMayBeChosen && !this.includesHex(this.properties.mustSelect, hex)) {
            return false;
        } else if(this.includesHex(this.selectedHexes, hex)) {
            return true;
        }

        return (
            this.selector.canTarget(hex, this.context, this.choosingPlayer) &&
			this.selector.checkWithOthers(this.selectedHexes, hex) &&
			!this.selector.wouldExceedLimit(this.selectedHexes, hex)
        );
    }

    selectHex(x, y) {
        let hex = {x: x, y: y};
    	if(this.selector.hasReachedLimit(this.selectedHexes) && !this.includesHex(this.selectedHexes, hex)) {
    		return false;
    	}

    	if(!this.includesHex(this.selectedHexes, hex)) {
    		this.selectedHexes.push(hex);
    	} else {
    		this.selectedHexes = _.reject(this.selectedHexes, p => p.x === hex.x && p.y === hex.y);
    	}
    	this.choosingPlayer.setSelectedHexes(this.selectedHexes);

    	return true;
    }

    fireOnSelect() {
    	let hexParam = this.selector.formatSelectParam(this.selectedHexes);
    	if(this.properties.onSelect(this.choosingPlayer, hexParam)) {
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
    	this.selectedHexes = [];
    	this.choosingPlayer.clearSelectedHexes();
    	this.choosingPlayer.clearSelectableHexes();

    	this.choosingPlayer.setSelectedHexes(this.previouslySelectedHexes);
    }
}

module.exports = SelectHexPrompt;
