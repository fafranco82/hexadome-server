const uuid = require('uuid');
const _ = require('lodash');

class GameObject {
    constructor(game, name) {
        this.game = game;
        this.name = name;
        this.id = name;
        this.type = '';
        this.facedown = false;
        this.uuid = uuid.v1();

        this.effects = [];
    }

    getType() {
        return this.type;
    }

    addEffect(effect) {
        this.effects.push(effect);
    }

    removeEffect(effect) {
        this.effects = this.effects.filter(e => e !== effect);
    }

    getEffects(type) {
        return _(this.effects).filter(e => e.type === type).map(e => e.getValue(this)).value();
    }

    sumEffects(type) {
        return _(this.effects).filter(e => e.type === type).reduce((total, effect) => {
            return total + effect.getValue(this);
        }, 0);
    }

    anyEffect(type) {
        return this.effects.filter(effect => effect.type === type).length > 0;
    }

    mostRecentEffect(type) {
        return _.last(this.getEffects(type));
    }

    allowGameAction(actionType, context = this.game.getFrameworkContext()) { // eslint-disable-line no-unused-vars
        /*if(GameActions[actionType]) {
            return GameActions[actionType]().canAffect(this, context);
        }
        return this.checkRestrictions(actionType, context);*/
        return true;
    }

    checkRestrictions(actionType, context) { // eslint-disable-line no-unused-vars
        //return !this.getEffects(EffectNames.AbilityRestrictions).some(restriction => restriction.isMatch(actionType, context));
        return true;
    }

    //SUMMARY
    getShortSummary(activePlayer) { // eslint-disable-line no-unused-vars
        return {
            id: this.id,
            label: this.name,
            name: this.name,
            facedown: this.facedown,
            type: this.getType()
        };
    }

    formatAsMessageArg() {
        return this.name;
    }
}

module.exports = GameObject;
