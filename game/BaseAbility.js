const _ = require('lodash');

const { Stages } = require('./Constants');

const AbilityTargetPiece = require('./targets/AbilityTargetPiece');

class BaseAbility {
	constructor(properties) {
		this.gameAction = properties.gameAction || [];
		if(!Array.isArray(this.gameAction)) {
			this.gameAction = [this.gameAction];
		}

		this.cost = this.buildCost(properties.cost);

		this.buildTargets(properties);

		this.nonDependentTargets = this.targets.filter(target => !target.properties.dependsOn);
	}	

	buildCost(cost) {
		if(!cost) {
			return [];
		}

		if(!Array.isArray(cost)) {
			return [cost];
		}

		return cost;
	}

	buildTargets(properties) {
		this.targets = [];
		if(properties.target) {
			this.targets.push(this.getAbilityTarget('target', properties.target));
		} else if(properties.targets) {
			for(const key of Object.keys(properties.targets)) {
				this.targets.push(this.getAbilityTarget(key, properties.targets[key]));
			}
		}
	}

	getAbilityTarget(name, properties) {
		if(properties.gameAction) {
			if(!Array.isArray(properties.gameAction)) {
				properties.gameAction = [properties.gameAction];
			}
		} else {
			properties.gameAction = [];
		}

		return new AbilityTargetPiece(name, properties, this);
	}

	meetsRequirements(context) {
		if(!this.canPayCosts(context)) {
			return 'cost';
		}

		if(this.targets.length === 0) {
			if(this.gameAction.length > 0 && !this.checkGameActionsForPotential(context)) {
				return 'condition';
			}
			return '';
		}

		return this.canResolveTargets(context) ? '' : 'targets';
	}

	checkGameActionsForPotential(context) {
        return this.gameAction.some(gameAction => gameAction.hasLegalTarget(context));
    }

	canPayCosts(context) {
		let contextCopy = context.copy({stage: Stages.Cost});
		return this.cost.every(cost => cost.canPay(contextCopy));
	}

	resolveCosts(events, context, results) {
		_.each(this.cost, cost => {
			context.game.queueSimpleStep(() => {
				if(!results.cancelled) {
					if(cost.addEventsToArray) {
						cost.addEventsToArray(events, context, results);
					} else {
						if(cost.resolve) {
							cost.resolve(context, results);
						}
						context.game.queueSimpleStep(() => {
							let newEvents = cost.payEvent ? cost.payEvent(context) : context.game.getEvent('payCost', {}, () => cost.pay(context));
							if(Array.isArray(newEvents)) {
								_.each(newEvents, event => {
									events.push(event);
								});
							} else {
								events.push(newEvents);
							}
						});
					}
				}
			});
		});
	}

	canResolveTargets(context) {
        return this.nonDependentTargets.every(target => target.canResolve(context));
    }

    hasLegalTargets(context) {
    	return this.nonDependentTargets.every(target => target.hasLegalTarget(context));
    }

    resolveTargets(context) {
    	let targetResults = {
    		cancelled: false
    	};

    	for(let target of this.targets) {
    		context.game.queueSimpleStep(() => target.resolve(context, targetResults));
    	}

    	return targetResults;
    }

	displayMessage(context) { // eslint-disable-line no-unused-vars
		
    }

    executeHandler(context) { // eslint-disable-line no-unused-vars

    }
}

module.exports = BaseAbility;
