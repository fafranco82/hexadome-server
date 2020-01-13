const _ = require('lodash');

const Costs = require('./costs');

const BaseAbility = require('./BaseAbility');
const AbilityContext = require('./AbilityContext');

const { Stages, Symbols, ActionTypes } = require('./Constants');

class SwitchAbility extends BaseAbility {
	constructor(game, character, properties) {
		super(properties);

		this.game = game;
        this.character = character;
        this.id = properties.id;
        this.properties = properties;

        this.title = properties.title || `characters.${this.character.id}.switches.${this.id}.title`;

        _.each(this.gameAction, gameAction => {
            gameAction.setDefaultTarget(context => {
                if(context.parentContext) {
                    let parentContext = context.parentContext;
                    if(parentContext.action.type === ActionTypes.Attack) {
                        if(parentContext.player === context.player) {
                            return [parentContext.target];
                        } else {
                            return [parentContext.source];
                        }
                    } else {
                        return [parentContext.target];
                    }
                } else {
                    return gameAction.defaultTargets(context);
                }
            });
        });

        this.handler = properties.handler || this.executeGameActions; 

        this.cost.push(Costs.symbols(properties.symbols || []));
	}

    createContext(parent) {
        return new AbilityContext({
            game: this.game,
            player: parent.source.owner,
            source: parent.source,
            ability: this,
            stage: Stages.PreTarget,
            parentContext: parent,
            action: parent.action
        });
    }

    executeHandler(context) {
        this.handler(context);
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

module.exports = SwitchAbility;
