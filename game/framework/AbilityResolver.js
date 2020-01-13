const _ = require('lodash');

const BaseStepWithPipeline = require('./basestepwithpipeline.js');
const SimpleStep = require('./SimpleStep');

const InitiateAbilityEventWindow = require('../events/InitiateAbilityEventWindow');

const { EventNames, Stages } = require('../Constants');

class AbilityResolver extends BaseStepWithPipeline {
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
            //new SimpleStep(this.game, () => this.resolveEarlyTargets()),
            //new SimpleStep(this.game, () => this.checkForCancel()),
            new SimpleStep(this.game, () => this.openInitiateAbilityEventWindow()),
        ]);
    }

    createSnapshot() {
        // TODO
        //this.context.cardStateWhenInitiated = this.context.source.createSnapshot();
    }

    openInitiateAbilityEventWindow() {
    	if(this.cancelled) {
    		return;
    	}

    	let eventName = EventNames.Unnamed;
    	let eventProps = {};

    	this.events.push(this.game.getEvent(eventName, eventProps, () => this.queueInitiateAbilitySteps()));
    	this.game.queueStep(new InitiateAbilityEventWindow(this.game, this.events));
    }

    queueInitiateAbilitySteps() {
    	this.queueStep(new SimpleStep(this.game, () => this.resolveCosts()));
    	this.queueStep(new SimpleStep(this.game, () => this.payCosts()));
    	//this.queueStep(new SimpleStep(this.game, () => this.checkCostsWerePaid()));
        //this.queueStep(new SimpleStep(this.game, () => this.resolveTargets()));
        this.queueStep(new SimpleStep(this.game, () => this.initiateAbilityEffects()));
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
    	this.context.ability.resolveCosts(this.costEvents, this.context, this.canPayResults);
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

    initiateAbilityEffects() {
    	if(this.cancelled) {
            for(const event of this.events) {
                event.cancel();
            }
            return;
        }

        this.context.ability.displayMessage(this.context);
        this.initiateAbility = true;
    }

    executeHandler() {
        if(this.cancelled || !this.initiateAbility) {
            return;
        }

        this.context.stage = Stages.Effect;
        this.context.ability.executeHandler(this.context);
    }
}

module.exports = AbilityResolver;
