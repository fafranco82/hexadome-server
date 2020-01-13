const _ = require('lodash');

const Phase = require('../Phase');
const SimpleStep = require('../SimpleStep');

const RunningOrderSelectionPrompt = require('./planning/RunningOrderSelectionPrompt');

class PlanningPhase extends Phase {
    constructor(game) {
        super(game, 'planning');
        this.initialise([
            new SimpleStep(game, () => this.scoringZoneSelection()),
            new SimpleStep(game, () => this.fakeRunningOrderSelection()),
            //new RunningOrderSelectionPrompt(game)
        ]);
    }

    scoringZoneSelection() {
        //return false;
    }

    fakeRunningOrderSelection() {
        _.each(this.game.getPlayers(), player => {
            _.each(player.characters, (character, index) => {
                player.runningOrder.setSlot(index, character);
            });
        });
    }
}


module.exports = PlanningPhase;
