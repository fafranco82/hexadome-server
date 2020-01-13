const _ = require('lodash');

const Costs = require('./costs');

const BaseAbility = require('./BaseAbility');
const ActionSwitchAbility = require('./ActionSwitchAbility');
const EffectAbility = require('./EffectAbility');
const ActionContext = require('./ActionContext');

const { Stages, ActionTypes, Players } = require('./Constants');

class ActionAbility extends BaseAbility {
	constructor(game, character, properties) {
		super(properties);

		this.game = game;
		this.character = character;
        this.id = properties.id;
        this.type = properties.type || ActionTypes.Normal;
        this.dice = this.buildDice(properties.dice || []);
        this.callRoll = this.dice.length > 0;
		this.properties = properties;
        this.title = properties.title || `characters.${character.id}.actions.${this.id}.title`;

        this.switches = this.buildSwitches(this.properties.switches || []);
        this.effects = this.buildEffects(this.properties.effect || []);

        this.cost.push(Costs.actionPoints(properties.points || 0));
	}

    buildDice(dice) {
        if(!Array.isArray(dice)) {
            return [dice];
        } else {
            return dice;
        }
    }

    buildSwitches(switches) {
        if(!Array.isArray(switches)) {
            switches = [switches];
        }

        return _.map(switches, switchAbility => {
            return new ActionSwitchAbility(this.game, this, switchAbility);
        });
    }

    buildEffects(effects) {
        if(!Array.isArray(effects)) {
            effects = [effects];
        }

        return _.map(effects, (effect, index) => {
            return new EffectAbility(this.game, this, Object.assign(effect, {order: index+1}));
        });
    }

    buildTargets(properties) {
        if(properties.range) {
            properties.target = {
                range: properties.range,
                controller: properties.type === ActionTypes.Attack ? Players.NotSelf : Players.Any,
            };
        }

        super.buildTargets(properties);
    }

	createContext(player = this.character.owner) {
		return new ActionContext({
            action: this,
            game: this.game,
            player: player,
            source: this.character,
            stage: Stages.PreTarget
        });
	}

    meetsRequirements(context) {
        if(_.some(this.effects, effect => !effect.canPayCosts(effect.createContext(this.action, context)))) {
            return 'cost';
        }

        return super.meetsRequirements(context);
    }

	displayMessage(context) {
        let message = this.properties.message || 'cards.generic.action.message';
        let messageArgs = this.properties.messageArgs || ((context) => _.pick(context, ['player', 'source', 'target']));
        if(typeof messageArgs === 'function') {
            messageArgs = messageArgs(context);
        }
        this.game.addMessage(message, messageArgs);
    }

    executeHandler(context) { // eslint-disable-line no-unused-vars
    	_.each(this.effects, effect => {
            this.game.resolveAbility(effect.createContext(this.action, context));
        });
    }
}

module.exports = ActionAbility;
