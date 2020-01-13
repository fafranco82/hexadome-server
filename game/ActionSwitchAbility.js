const _ = require('lodash');

const Costs = require('./costs');

const SwitchAbility = require('./SwitchAbility');
const AbilityContext = require('./AbilityContext');

const { Stages, Symbols } = require('./Constants');

class ActionSwitchAbility extends SwitchAbility {
	constructor(game, action, properties) {
		super(game, action.character, properties);

		this.action = action;
        this.title = properties.title || `characters.${this.character.id}.actions.${this.action.id}.switches.${this.id}.title`;
	}
}

module.exports = ActionSwitchAbility;
