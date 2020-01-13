const _ = require('lodash');

const Phase = require('../Phase');
const SimpleStep = require('../SimpleStep');

class SetupPhase extends Phase {
    constructor(game) {
        super(game, 'setup');
        this.initialise([
            new SimpleStep(game, () => this.announcePlayers()),
            new SimpleStep(game, () => this.setUnderdog()), //STEP 6: Underdog
        ]);
    }

    announcePlayers() {
        _.each(this.game.getPlayers(), player => {
            this.game.addMessage('[i18n] [[player]] is here', {
                player: player
            });
        });

        this.game.activeScoringZone = 'center'; // TODO 
    }

    setUnderdog() {
        _.each(this.game.getPlayers(), player => {
            this.game.addMessage(`[i18n] [[player]] total initiative is [[initiative]]`, {player: player, initiative: _.sumBy(player.characters, 'initiative')});
        });
        this.game.underdog = _.minBy(this.game.getPlayers(), player => _.sumBy(player.characters, 'initiative') + Math.random());
        this.game.addMessage('[i18n] Underdog is [[player]]', {player: this.game.underdog});
    }
}


module.exports = SetupPhase;
