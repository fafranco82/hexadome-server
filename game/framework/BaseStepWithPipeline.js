const BaseStep = require('./BaseStep');
const Pipeline = require('./Pipeline');


class BaseStepWithPipeline extends BaseStep {
    constructor(game) {
        super(game);
        this.pipeline = new Pipeline();
    }

    isCompleted() {
        return this.pipeline.length === 0;
    }

    continue() {
        try {
            return this.pipeline.continue();
        } catch (e) {
            this.game.reportError(e);
            return true;
        }
    }

    queueStep(step) {
        this.pipeline.queueStep(step);
    }

    onCardClicked(player, card) {
        this.pipeline.handleCardClicked(player, card);
    }

    onHexClicked(player, position) {
        this.pipeline.handleHexClicked(player, position);
    }

    onPieceClicked(player, piece) {
        this.pipeline.handlePieceClicked(player, piece);
    }

    onMenuCommand(player, arg, method) {
        return this.pipeline.handleMenuCommand(player, arg, method);
    }

    cancelStep() {
        this.pipeline.cancelStep();
    }
}

module.exports = BaseStepWithPipeline;
