const _ = require('lodash');

class Pipeline {
    constructor() {
        this.pipeline = [];
        this.queue = [];
    }

    initialise(steps) {
        if(!_.isArray(steps)) {
            steps = [steps];
        }

        this.pipeline = steps;
    }

    get length() {
        return this.pipeline.length;
    }

    getCurrentStep() {
        let step = _.head(this.pipeline);

        if(_.isFunction(step)) {
            let createdStep = step();
            this.pipeline[0] = createdStep;
            return createdStep;
        }

        return step;
    }

    queueStep(step) {
        if(this.pipeline.length === 0) {
            this.pipeline.unshift(step);
        } else {
            let currentStep = this.getCurrentStep();
            if(currentStep.queueStep) {
                currentStep.queueStep(step);
            } else {
                this.queue.push(step);
            }
        }
    }

    clear() {
        this.cancelStep();
        this.pipeline = [];
        this.queue = [];
    }

    cancelStep() {
        if(this.pipeline.length === 0) {
            return;
        }

        let step = this.getCurrentStep();

        if(step.cancelStep && step.isComplete) {
            step.cancelStep();
            if(!step.isComplete())
                return;
        }

        this.pipeline.shift();
    }

    continue() {
        if(this.queue.length > 0) {
            this.pipeline = this.queue.concat(this.pipeline);
            this.queue = [];
        }

        while(this.pipeline.length > 0) {
            let currentStep = this.getCurrentStep();
            if(currentStep.continue() === false) {
                if(this.queue.length === 0) {
                    return false;
                }
            } else {
                this.pipeline = _.tail(this.pipeline, 1);
            }

            this.pipeline = this.queue.concat(this.pipeline);
            this.queue = [];
        }
        return true;
    }

    handleCardClicked(player, card) {
        if(this.pipeline.length > 0) {
            let step = this.getCurrentStep();
            if(step.onCardClicked(player, card) !== false) {
                return true;
            }
        }

        return false;
    }

    handleHexClicked(player, position) {
        if(this.pipeline.length > 0) {
            let step = this.getCurrentStep();
            if(step.onHexClicked(player, position) !== false) {
                return true;
            }
        }

        return false;
    }

    handlePieceClicked(player, piece) {
        if(this.pipeline.length > 0) {
            let step = this.getCurrentStep();
            if(step.onPieceClicked(player, piece) !== false) {
                return true;
            }
        }

        return false;
    }

    handleMenuCommand(player, arg, method) {
        if(this.pipeline.length > 0) {
            let step = this.getCurrentStep();
            if(step.onMenuCommand(player, arg, method) !== false) {
                return true;
            }
        }

        return false;
    }
}

module.exports = Pipeline;
