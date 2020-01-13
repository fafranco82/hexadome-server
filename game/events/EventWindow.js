const _ = require('lodash');

const BaseStepWithPipeline = require('../framework/BaseStepWithPipeline');
const SimpleStep = require('../framework/SimpleStep');

class EventWindow extends BaseStepWithPipeline {
	constructor(game, events) {
		super(game);

		this.events = [];

		_.each(events, event => {
			if(!event.cancelled) {
				this.addEvent(event);
			}
		});

		this.initialise();
	}

	initialise() {
		this.pipeline.initialise([
			new SimpleStep(this.game, () => this.setCurrentEventWindow()),
			new SimpleStep(this.game, () => this.checkEventCondition()),
			//new SimpleStep(this.game, () => this.openWindow(AbilityTypes.WouldInterrupt)),
			//new SimpleStep(this.game, () => this.createContigentEvents()),
            //new SimpleStep(this.game, () => this.openWindow(AbilityTypes.ForcedInterrupt)),
            //new SimpleStep(this.game, () => this.openWindow(AbilityTypes.Interrupt)),
            //new SimpleStep(this.game, () => this.preResolutionEffects()),
            new SimpleStep(this.game, () => this.executeHandler()),
            new SimpleStep(this.game, () => this.checkGameState()),
            //new SimpleStep(this.game, () => this.checkThenAbilities()),
            //new SimpleStep(this.game, () => this.openWindow(AbilityTypes.ForcedReaction)),
            //new SimpleStep(this.game, () => this.openWindow(AbilityTypes.Reaction)),
            new SimpleStep(this.game, () => this.resetCurrentEventWindow())
		]);
	}

	addEvent(event) {
		event.setWindow(this);
		this.events.push(event);
		return event;
	}

	removeEvent(event) {
		this.events = _.reject(this.events, e => e === event);
		return event;
	}

	setCurrentEventWindow() {
        this.previousEventWindow = this.game.currentEventWindow;
        this.game.currentEventWindow = this;
    }

    checkEventCondition() {
        _.each(this.events, event => event.checkCondition());
    }

    executeHandler() {
    	this.events = _.sortBy(this.events, 'order');

    	_.each(this.events, event => {
    		event.checkCondition();
    		if(!event.cancelled) {
    			event.executeHandler();
    			this.game.emit(event.name, event);
    		}
    	});
    }

    checkGameState() {
        //this.game.checkGameState(_.some(this.events, event => event.handler), this.events);
    }

    resetCurrentEventWindow() {
        if(this.previousEventWindow) {
            this.previousEventWindow.checkEventCondition();
            this.game.currentEventWindow = this.previousEventWindow;
        } else {
            this.game.currentEventWindow = null;
        }
    }
}

module.exports = EventWindow;
