const _ = require('lodash');

const BaseStepWithPipeline = require('./basestepwithpipeline.js');
const SimpleStep = require('./SimpleStep');

const InitiateActionEventWindow = require('../events/InitiateActionEventWindow');

const { EventNames, Stages, ActionTypes, RollTypes } = require('../Constants');

class ActionResolver extends BaseStepWithPipeline {
	constructor(game, context) {
		super(game);

		this.context = context;

		this.events = [];

		this.canCancel = true;

		this.initialise();
	}

	initialise() {
		this.pipeline.initialise([
			new SimpleStep(this.game, () => this.createSnapshot()),
			new SimpleStep(this.game, () => this.openInitiateActionEventWindow()),
		]);
	}

	createSnapshot() {
        // TODO
        //this.context.cardStateWhenInitiated = this.context.source.createSnapshot();
    }

    openInitiateActionEventWindow() {
    	if(this.cancelled) {
    		return;
    	}

    	let eventName = EventNames.Unnamed;
    	let eventProps = {};

    	this.events.push(this.game.getEvent(eventName, eventProps, () => this.queueInitiateActionSteps()));
    	this.game.queueStep(new InitiateActionEventWindow(this.game, this.events));
    }

    queueInitiateActionSteps() {
    	this.queueStep(new SimpleStep(this.game, () => this.resolveCosts()));
    	this.queueStep(new SimpleStep(this.game, () => this.payCosts()));
    	//this.queueStep(new SimpleStep(this.game, () => this.checkCostsWerePaid()));
        this.queueStep(new SimpleStep(this.game, () => this.resolveTargets()));
        this.queueStep(new SimpleStep(this.game, () => this.announceActionDeclaration()));
        this.queueStep(new SimpleStep(this.game, () => this.openRollWindow()));
        this.queueStep(new SimpleStep(this.game, () => this.initiateActionEffects()));
        this.queueStep(new SimpleStep(this.game, () => this.executeHandler()));
    }

    resolveCosts() {
    	if(this.cancelled) {
    		return;
    	}

    	this.canPayResults = {
    		cancelled: false,
    		canCancel: this.canCancel
    	};

    	this.costEvents = [];
    	this.context.stage = Stages.Cost;
    	this.context.action.resolveCosts(this.costEvents, this.context, this.canPayResults);
    }

    payCosts() {
    	if(this.cancelled) {
    		return;
    	} else if(this.canPayResults.cancelled) {
    		this.cancelled = true;
    		return;
    	}

    	if(this.costEvents.length > 0) {
    		this.game.openEventWindow(this.costEvents);
    	}
    }

    resolveTargets() {
    	if(this.cancelled) {
    		return;
    	}
    	this.context.stage = Stages.Target;

    	if(!this.context.action.hasLegalTargets(this.context)) {
    		this.game.addMessage('[i18n] [[player]] attempted to use [[source]], but there are insufficient legal targets', {
                player: this.context.player,
                source: this.context.source
            });
    	}

    	this.context.action.resolveTargets(this.context);
    }

    announceActionDeclaration() {
        if(this.cancelled) {
            return;
        }

        //pepe performs hEXx3R's action Gotcha! against [[target]] 
        this.context.action.displayMessage(this.context);
    }

    openRollWindow() {
        if(this.cancelled) {
            return;
        }

        if(this.context.action.callRoll) {
            let properties = {
                context: this.context,
                activeDice: context => this.context.action.dice
            };

            if(this.context.action.type === ActionTypes.Attack) {
                properties = Object.assign(properties, {
                    type: RollTypes.FaceToFace,
                    otherDice: context => context.target.defense
                });
            }

            this.game.makeDiceRoll(properties);
        }
    }

    initiateActionEffects() {
    	if(this.cancelled) {
            for(const event of this.events) {
                event.cancel();
            }
            return;
        }

        this.initiateAction = true;
    }

    executeHandler() {
        if(this.cancelled || !this.initiateAction) {
            return;
        }

        this.context.stage = Stages.Effect;
        this.context.action.executeHandler(this.context);
    }
}

module.exports = ActionResolver;
