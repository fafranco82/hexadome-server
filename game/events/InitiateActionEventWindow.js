const _ = require('lodash');

const EventWindow = require('./EventWindow');

const { EventNames } = require('../Constants');

class InitiateActionEventWindow extends EventWindow {
	executeHandler() {
        this.events = _.sortBy(this.events, 'order');

        _.each(this.events, event => {
            event.checkCondition();
            if(!event.cancelled) {
                event.executeHandler();
            }
        });

        this.game.queueSimpleStep(() => this.emitEvents());
    }

    emitEvents() {
        _.each(this.events, event => this.game.emit(event.name, event));
    }
}

module.exports = InitiateActionEventWindow;
