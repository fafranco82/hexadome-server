
const CharacterActionStepWindow = require('./CharacterActionStepWindow');

const BaseStepWithPipeline = require('../../BaseStepWithPipeline');
const SimpleStep = require('../../SimpleStep');

const { EventNames } = require('../../../Constants');

class CharacterActivation extends BaseStepWithPipeline {
	constructor(game, activeCharacter) {
		super(game);
		this.activeCharacter = activeCharacter;
		this.pipeline.initialise([
            new SimpleStep(game, () => this.preparationStep()),
            new SimpleStep(game, () => this.actionStep()),
            new SimpleStep(game, () => this.statesStep())
        ]);
	}

	preparationStep() {
		this.game.addMessage('game.phases.turns.activation.started', {
			character: this.activeCharacter
		});
		this.game.raiseEvent(EventNames.OnActivationStarted, {activeCharacter: this.activeCharacter});
		this.game.raiseEvent(EventNames.OnPreparationStepStarted, {activeCharacter: this.activeCharacter});
		this.activeCharacter.actionPoints = this.activeCharacter.energy;
		this.activeCharacter.movementPoints = 0;
		this.game.activeCharacter = this.activeCharacter;

		// TODO character benched -> deploy it

		this.game.raiseEvent(EventNames.OnPreparationStepEnded, {activeCharacter: this.activeCharacter});
	}

	actionStep() {
		this.game.raiseEvent(EventNames.OnActionStepStarted, {activeCharacter: this.activeCharacter});
		this.game.queueStep(new CharacterActionStepWindow(this.game, this.activeCharacter));
		this.game.raiseEvent(EventNames.OnActionStepEnded, {activeCharacter: this.activeCharacter});
	}

	statesStep() {
		this.activeCharacter.actionPoints = 0;
		this.activeCharacter.movementPoints = 0;
		this.game.raiseEvent(EventNames.OnStatesStepStarted, {activeCharacter: this.activeCharacter});

		// TODO remove blue states
		// TODO flip red states

		this.game.raiseEvent(EventNames.OnStatesStepEnded, {activeCharacter: this.activeCharacter});
		this.game.raiseEvent(EventNames.OnActivationEnded, {activeCharacter: this.activeCharacter});
		this.game.activeCharacter = undefined;
		this.game.addMessage('game.phases.turns.activation.ended', {
			character: this.activeCharacter
		});
	}
}

module.exports = CharacterActivation;
