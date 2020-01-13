const _ = require('lodash');

const Phase = require('../Phase');
const SimpleStep = require('../SimpleStep');

//const { CardTypes, Locations } = require('../../Constants');

class ObjectivesPhase extends Phase {
    constructor(game) {
        super(game, 'objectives');
        this.initialise([
            new SimpleStep(game, () => this.stall()),
        ]);
    }

    stall() {
        //return false;
    }
}


module.exports = ObjectivesPhase;
