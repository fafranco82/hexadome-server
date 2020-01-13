const _ = require('lodash');

const UiPrompt = require('./UiPrompt');

class ApplySwitchesPrompt extends UiPrompt {
	constructor(game, choosingPlayer, properties) {
		super(game);

		this.choosingPlayer = choosingPlayer;

        this.properties = properties;
        this.context = properties.context;

        this.availableSwitches = properties.switches || [];
        this.switches = [];
	}

	activeCondition(player) {
        return player === this.choosingPlayer;
    }

    continue() {
        if(!this.isCompleted()) {
            this.filterSwitches();
        }

        return super.continue();
    }

    createContext(ability) {
        return ability.createContext(this.context).copy({player: this.choosingPlayer});
    }

    filterSwitches() {
        this.switches = this.availableSwitches.filter(switchAbility => switchAbility.meetsRequirements(this.createContext(switchAbility)) === '');;
    }

    activePrompt() {
        return {
            promptTitle: 'game.prompts.switches.titles.prompt',
            menuTitle: 'game.prompts.switches.titles.active',
            buttons: _.map(this.switches, (switchAbility, index) => {
                return {
                    arg: ['switch', index],
                    text: {
                        message: switchAbility.title
                    }
                };
            }).concat([{ arg: 'done', text: {message: 'game.prompts.common.buttons.done'} }])
        };
    }

    waitingPrompt() {
        return {
            promptTitle: 'game.prompts.switches.titles.prompt',
            menuTitle: this.properties.waitingPromptTitle || 'game.prompts.switches.titles.waiting'
        };
    }

    onMenuCommand(player, choice, index) {
        if(!this.activeCondition(player)) {
            return false;
        }

        if(choice === 'switch') {
            let switchAbility = this.switches[index];
            if(switchAbility) {
                this.game.resolveAbility(this.createContext(switchAbility));
                return true;
            }
        }

        if(choice === 'done') {
            this.done();
            return true;
        }
    }

    done() {
        this.complete();
    }
}

module.exports = ApplySwitchesPrompt;
