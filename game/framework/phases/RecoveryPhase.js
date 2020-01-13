const _ = require('lodash');

const Phase = require('../Phase');
const SimpleStep = require('../SimpleStep');

//const { CardTypes, Locations } = require('../../Constants');

class RecoveryPhase extends Phase {
    constructor(game) {
        super(game, 'recovery');
        this.initialise([
            new SimpleStep(game, () => this.stall()),
        ]);
    }

    stall() {
        //return false;
    }
}


module.exports = RecoveryPhase;
