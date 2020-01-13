const GamePiece = require('./GamePiece');

const ActionAbility = require('./ActionAbility');
const SwitchAbility = require('./SwitchAbility');

const AbilityDsl = require('./AbilityDSL');

const { DieColors, ActionTypes, EffectTypes } = require('./Constants');

class BaseCharacter extends GamePiece {
	constructor(owner, data) {
		super(data.id, owner, owner.game);

		this.type = 'character';

		this.printedInitiative = data.initiative;
		this.printedSpeed = data.speed;
		this.printedEnergy = data.energy;
		this.printedHealth = data.health;

		this.states = [];
		this.actionPoints = 0;
		this.movementPoints = 0;
		this.damage = 0;
		this.frags = 0;

		this.defense = data.defense;

		this.abilities = {
			actions: [],
			switches: []
		};

		this.action({
			id: 'move',
			title: 'game.actions.move.title',
			points: 2,
			message: 'game.actions.move.message',
			messageArgs: context => ({
				player: context.player,
				source: context.source,
				speed: context.source.speed
			}),
			effect: {
				type: EffectTypes.Automatic,
				gameAction: AbilityDsl.actions.addMovementPoints(context => ({amount: context.source.speed}))
			}
		});

		this.attack({
			id: 'contender',
			title: 'game.actions.contender.title',
			points: 3,
			dice: DieColors.Orange,
			range: [1, 8]
		});

		this.setupCardAbilities(AbilityDsl);
	}

	setupCardAbilities(abilities) { // eslint-disable-line no-unused-vars
    }

    get initiative() {
		return this.printedInitiative;
	}

	get speed() {
		return this.printedSpeed;
	}

	get energy() {
		return this.printedEnergy;
	}

	get health() {
		return this.printedHealth;
	}

	get actions() {
		return this.abilities.actions;
	}

	get switches() {
		return this.abilities.switches;
	}

	getActions() {
		return this.actions.slice();
	}

	getSwitches() {
		return this.switches.slice();
	}

	action(properties) {
		this.abilities.actions.push(this.createAction(Object.assign(properties, {type: ActionTypes.Normal})));
	}

	attack(properties) {
		this.abilities.actions.push(this.createAction(Object.assign(properties, {type: ActionTypes.Attack})));
	}

	switch(properties) {
		this.abilities.switches.push(this.createSwitch(properties));
	}

	createAction(properties) {
		return new ActionAbility(this.game, this, properties);
	}

	createSwitch(properties) {
		return new SwitchAbility(this.game, this, properties);
	}

	addMovementPoints(amount) {
		this.movementPoints += amount;
	}

	imposeState(state) {
		console.log(state);
	}

	blocksMovement() {
		return true;
	}

	blocksLineOfSight() {
		return true;
	}

	providesCover() {
		return true;
	}

	// SUMMARY
	getState(activePlayer) {
		return {
			uuid: this.uuid,
			id: this.id,
			player: {
				team: this.owner.team,
				name: this.owner.name
			},
			active: this.game.activeCharacter === this,
			initiative: this.initiative,
			speed: this.speed,
			energy: this.energy,
			health: this.health,
			actionPoints: this.actionPoints,
			movementPoints: this.movementPoints,
			damage: this.damage,
			frags: this.frags,
			states: []
		};
	}

    getSummary(activePlayer) {
    	let summary = super.getSummary(activePlayer);

    	summary.id = this.id;
    	summary.active = this.game.activeCharacter === this,
    	summary.player = {
    		team: this.owner.team,
    		name: this.owner.name
    	};

    	return summary;
    }

    formatAsMessageArg() {
        return {arg: 'character', uuid: this.uuid, id: this.id, team: this.owner.team};
    }
}

module.exports = BaseCharacter;
