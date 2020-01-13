const BaseStep = require('./basestep.js');
const SimpleStep = require('./simplestep.js');
const Pipeline = require('./pipeline.js');

const { EventNames } = require('../Constants');

class Phase extends BaseStep {
    constructor(game, name) {
        super(game);
        this.name = name;
        this.pipeline = new Pipeline();
    }

    startPhase() {
        this.game.currentPhase = this.name;
        for(const player of this.game.getPlayers()) {
            player.phase = this.name;
        }

        this.game.raiseEvent(EventNames.OnPhaseStarted, { phase: this.name });
        this.game.addAlert('phasestart', `game.phases.${this.name}.name`);
    }

    endPhase() {
        this.game.raiseEvent(EventNames.OnPhaseEnded, { phase: this.name });
        this.game.currentPhase = '';
        for(const player of this.game.getPlayers()) {
            player.phase = '';
        }

        this.game.raiseEvent(EventNames.OnAtEndOfPhase);
    }

    // PIPELINE METHODS
    initialise(steps) {
        let startStep = new SimpleStep(this.game, () => this.startPhase());
        let endStep = new SimpleStep(this.game, () => this.endPhase());
        this.pipeline.initialise([startStep].concat(steps).concat([endStep]));
    }

    queueStep(step) {
        this.pipeline.queueStep(step);
    }

    isComplete() {
        return this.pipeline.lenght === 0;
    }

    onCardClicked(player, card) {
        return this.pipeline.handleCardClicked(player, card);
    }

    onHexClicked(player, x, y) {
        return this.pipeline.handleHexClicked(player, x, y);
    }

    onPieceClicked(player, piece) {
        return this.pipeline.handlePieceClicked(player, piece);
    }

    onMenuCommand(player, arg, method) {
        return this.pipeline.handleMenuCommand(player, arg, method);
    }

    cancelStep() {
        this.pipeline.cancelStep();
    }

    continue() {
        return this.pipeline.continue();
    }
}

module.exports = Phase;
