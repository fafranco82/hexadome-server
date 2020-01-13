const ActionAbility = require('./ActionAbility');

const { Stages } = require('./Constants');

class ActionContext {
	constructor(properties) {
		this.game = properties.game;
		this.source = properties.source /*|| new EffectSource(this.game)*/;
        this.player = properties.player;
        this.action = properties.action || new ActionAbility({});
        this.costs = properties.costs || {};
        this.targets = properties.targets || {};
        this.rolls = properties.symbols || {};
		this.stage = properties.stage || Stages.Effect;
	}

	copy(newProps) {
		let copy = this.createCopy(newProps);
		copy.target = this.target;
		return copy;
	}

	createCopy(newProps) {
		return new ActionContext(Object.assign(this.getProps(), newProps));
	}

	getProps() {
		return {
			game: this.game,
            source: this.source,
            player: this.player,
            action: this.action,
            costs: Object.assign({}, this.costs),
            targets: Object.assign({}, this.targets),
			rolls: this.rolls,
			stage: this.stage
		};
	}
}

module.exports = ActionContext;
