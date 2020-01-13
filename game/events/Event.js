const _ = require('lodash');

const { EventNames } = require('../Constants');

class Event {
    constructor(name, params, handler) {
    	this.name = name;
    	this.handler = handler;

    	this.order = 0;
    	this.cancelled = false;
    	this.window = null;
    	this.condition = (event) => true; // eslint-disable-line no-unused-vars

    	_.extend(this, params);
    }

    cancel() {
    	this.cancelled = true;
    	if(this.window) {
    		this.window.removeEvent(this);
    	}
    }

    setWindow(window) {
    	this.window = window;
    }

    unsetWindow() {
    	this.window = null;
    }

    checkCondition() {
    	if(this.cancelled || this.resolved || this.name === EventNames.Unnamed) {
    		return;
    	}

    	if(!this.condition(this)) {
    		this.cancel();
    	}
    }

    executeHandler() {
    	this.resolved = true;
    	if(this.handler) {
    		this.handler(this);
    	}
    }

    replaceHandler(newHandler) {
        this.handler = newHandler;
    }
}

module.exports = Event;
