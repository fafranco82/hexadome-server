const BaseAbility = require('./BaseAbility');

const { Stages } = require('./Constants');

class AbilityContext {
	constructor(properties) {
		this.game = properties.game;
		this.source = properties.source /*|| new EffectSource(this.game)*/;
        this.player = properties.player;
        this.ability = properties.ability || new BaseAbility({});
        this.parentContext = properties.parentContext;
		this.stage = properties.stage || Stages.Effect;
	}

	copy(newProps) {
		let copy = this.createCopy(newProps);
		return copy;
	}

	createCopy(newProps) {
		return new AbilityContext(Object.assign(this.getProps(), newProps));
	}

	getProps() {
		return {
			game: this.game,
            source: this.source,
            player: this.player,
            ability: this.ability,
            parentContext: this.parentContext ? this.parentContext.copy() : null,
			stage: this.stage
		};
	}
}

module.exports = AbilityContext;
