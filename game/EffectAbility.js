const _ = require('lodash');

const BaseAbility = require('./BaseAbility');
const AbilityContext = require('./AbilityContext');

const { Stages, EffectTypes, Symbols } = require('./Constants');

class EffectAbility extends BaseAbility {
	constructor(game, action, properties) {
		super(properties);

		this.game = game;
		this.action = action;
        this.properties = properties;
        this.title = properties.title || `characters.${action.character.id}.actions.${action.id}.effect${properties.order > 1 ? properties.order : ''}.title`;
        this.type = properties.type || EffectTypes.Conditional;

        _.each(this.gameAction, gameAction => {
            gameAction.setDefaultTarget(context => {
                if(context.parentContext && context.parentContext.target) {
                    return [context.parentContext.target];
                } else {
                    return gameAction.defaultTargets(context);
                }
            });
        });
		
		this.handler = properties.handler || this.executeGameActions;        
	}

	executeHandler(context) { // eslint-disable-line no-unused-vars
        if(this.type === EffectTypes.Automatic) {
            return this.handler(context);
        }

        let rollResult = context.parentContext.rolls[context.player.name];
        if(rollResult && rollResult.filter(s => _.includes([Symbols.Success, Symbols.CriticalSuccess], s)).length === 0) {
            return;
        }

        this.game.promptWithHandlerMenu(context.player, {
            promptTitle: this.title,
            activePromptTitle: 'game.prompts.effects.apply.title.active',
            choices: ['game.prompts.common.buttons.yes', 'game.prompts.common.buttons.no'],
            handlers: [
                () => {
                    this.handler(context);
                    return true
                },
                () => true
            ]
        });
    }

    createContext(action = this.action, parent = null) {
		return new AbilityContext({
            game: this.game,
            player: action.character.owner,
            source: action.character,
            ability: this,
            stage: Stages.PreTarget,
            parentContext: parent,
            symbols: parent ? parent.symbols : []
        });
	}

    executeGameActions(context) {
        context.events = [];
        let actions = this.getGameActions(context);

        for(const action of actions) {
            this.game.queueSimpleStep(() => action.addEventsToArray(context.events, context));
        }

        this.game.queueSimpleStep(() => {
            let eventsToResolve = context.events.filter(event => !event.cancelled && !event.resolved);
            if(eventsToResolve.length > 0) {
                let window = this.openEventWindow(eventsToResolve);
            }
        });
    }

    getGameActions(context) {
        let actions = this.targets.reduce((array, target) => array.concat(target.getGameAction(context)), []);
        return actions.concat(this.gameAction);
    }

    openEventWindow(events) {
        return this.game.openEventWindow(events);
    }
}

module.exports = EffectAbility;
