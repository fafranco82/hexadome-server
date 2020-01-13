const Event = require('../events/Event');
const { EventNames } = require('../Constants');

class GameAction {
	constructor(propertyFactory = {}) {
		this.targetType = [];
		this.eventName = EventNames.Unnamed;
		this.name = '';
		this.getDefaultTargets = (context) => this.defaultTargets(context);

		if(typeof propertyFactory === 'function') {
			this.propertyFactory = propertyFactory;
		} else {
			this.properties = propertyFactory;
		}
	}

	getDefaultProperties() {
		return {
			optional: false
		};
	}

	defaultTargets() {
		return [];
	}

	getProperties(context, additionalProperties = {}) {
		let properties = Object.assign({
			target: this.getDefaultTargets(context)
		}, this.getDefaultProperties(), this.properties || this.propertyFactory(context), additionalProperties);

		if(!Array.isArray(properties.target)) {
			properties.target = [properties.target];
		}

		properties.target = properties.target.filter(target => !!target);
		return properties;
	}

	setDefaultTarget(func) {
        this.getDefaultTargets = func;
    }

    hasLegalTarget(context, additionalProperties = {}) {
        let properties = this.getProperties(context, additionalProperties);
        return properties.target.some(target => this.canAffect(target, context, additionalProperties));
    }

    allTargetsLegal(context, additionalProperties = {}) {
        let properties = this.getProperties(context, additionalProperties);
        return properties.target.every(target => this.canAffect(target, context, additionalProperties));
    }

    canAffect(target, context, additionalProperties = {}) {
        let properties = this.getProperties(context, additionalProperties); // eslint-disable-line no-unused-vars

        return this.targetType.includes(target.type);
    }

	addEventsToArray(events, context, additionalProperties = {}) {
		let properties = this.getProperties(context, additionalProperties);
		for(const target of properties.target) {
			events.push(this.getEvent(target, context, additionalProperties));
		}
	}

	getEvent(target, context, additionalProperties = {}) {
		let event = this.createEvent(target, context, additionalProperties);
		this.updateEvent(event, target, context, additionalProperties);
		return event;
	}

	createEvent(target, context, additionalProperties = {}) {
		let event = new Event(EventNames.Unnamed, {});
		event.checkFullyResolved = eventAtResolution => this.isFullyResolved(eventAtResolution, target, context, additionalProperties);
		return event;
	}

	updateEvent(event, target, context, additionalProperties = {}) {
		event.name = this.eventName;
		this.addPropertiesToEvent(event, target, context, additionalProperties);
		event.replaceHandler(event => this.eventHandler(event, additionalProperties));
		event.condition = () => this.checkEventCondition();
	}

	addPropertiesToEvent(event, target, context, additionalProperties = {}) { // eslint-disable-line no-unused-vars
        event.context = context;
    }

    isEventFullyResolved(event, target, context, additionalProperties = {}) { // eslint-disable-line no-unused-vars
        return !event.cancelled && event.name === this.eventName;
    }

    checkEventCondition() {
        return true;
    }

    eventHandler() {

    }

    isOptional(context, additionalProperties) {
        const { optional } = this.getProperties(context, additionalProperties);
        return optional;
    }
}

module.exports = GameAction;
