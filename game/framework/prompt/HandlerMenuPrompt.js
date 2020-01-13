const _ = require('lodash');
const UiPrompt = require('./UiPrompt');

class HandlerMenuPrompt extends UiPrompt {
	constructor(game, player, properties) {
        super(game);
        this.player = player;


        this.properties = properties;
        //TODO Context
    }

    activeCondition(player) {
        return player == this.player;
    }

    activePrompt() {
    	let buttons = [];

    	buttons = buttons.concat(_.map(this.properties.choices, (choice, index) => {
            return {
                text: _.isString(choice) ? {message: choice} : choice,
                arg: index
            };
        }));

        return {
            promptTitle: this.properties.promptTitle,
            menuTitle: this.properties.activePromptTitle || 'game.prompts.common.titles.selectone',
            buttons: buttons
        }; // TODO
    }

    waitingPrompt() {
        return {
            promptTitle: this.properties.promptTitle,
            menuTitle: this.properties.waitingPromptTitle || 'game.prompts.common.titles.waiting'
        };
    }

    onMenuCommand(player, arg) {
        if(!this.activeCondition(player)) {
            return false;
        }

        if(this.properties.choiceHandler) {
            this.properties.choiceHandler(this.properties.choices[arg]);
            this.complete();
            return true;
        }

        if(!this.properties.handlers[arg]) {
            return false;
        }

        this.properties.handlers[arg]();
        this.complete();

        return true;
    }
}

module.exports = HandlerMenuPrompt;
