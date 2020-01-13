const _ = require('lodash');
const UiPrompt = require('./UiPrompt');

class AllPlayerPrompt extends UiPrompt {
    activeCondition(player) {
        return !this.completionCondition(player);
    }

    completionCondition() {
        return false;
    }

    isCompleted() {
        return _.every(this.game.getPlayers(), player => {
            return this.completionCondition(player);
        });
    }
}

module.exports = AllPlayerPrompt;
