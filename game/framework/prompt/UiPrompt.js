const _ = require('lodash');
const BaseStep = require('../BaseStep');

class UiPrompt extends BaseStep {
    constructor(game) {
        super(game);
        this.completed = false;
    }

    isCompleted() {
        return this.completed;
    }

    complete() {
        this.completed = true;
    }

    activeCondition(player) { // eslint-disable-line no-unused-vars
        return true;
    }

    activePrompt(player) { // eslint-disable-line no-unused-vars

    }

    waitingPrompt() {
        return {
            menuTitle: 'game.prompt.common.titles.waiting'
        };
    }

    clearPrompts() {
        _.each(this.game.getPlayers(), player => {
            player.cancelPrompt();
        });
    }

    onCompleted() {

    }

    continue() {
        let completed = this.isCompleted();

        if(completed) {
            this.clearPrompts();
            this.onCompleted();
        } else {
            this.setPrompt();
        }

        return completed;
    }

    setPrompt() {
        _.each(this.game.getPlayers(), player => {
            if(this.activeCondition(player)) {
                player.setPrompt(this.addDefaultCommandToButtons(this.activePrompt(player)));
                //player.startClock(); // TODO add timers (ringteki)
            } else {
                player.setPrompt(this.addDefaultCommandToButtons(this.waitingPrompt(player)));
            }
        });
    }

    addDefaultCommandToButtons(original) {
        let prompt = _.clone(original);
        if(prompt.buttons) {
            _.each(prompt.buttons, button => {
                button.command = button.command || 'menuButton';
            });
        }
        return prompt;
    }
}

module.exports = UiPrompt;
