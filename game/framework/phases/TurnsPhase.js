const _ = require('lodash');

const CharacterActivation = require('./turns/CharacterActivation');

const Phase = require('../Phase');
const SimpleStep = require('../SimpleStep');

class TurnsPhase extends Phase {
    constructor(game) {
        super(game, 'turns');
        this.initialise([
            new SimpleStep(game, () => this.beginTurn(0)),
            new SimpleStep(game, () => this.beginTurn(1)),
            new SimpleStep(game, () => this.beginTurn(2)),
            new SimpleStep(game, () => this.beginTurn(3))
        ]);
    }

    beginTurn(turn) {
        this.game.addAlert('turnbegin', 'game.phases.turns.beginturn', {turn: turn+1});

        // reveal and get characters
        let characters = _.map(this.game.getPlayers(), player => {
        	player.runningOrder.revealSlot(turn);
        	return player.runningOrder.getSlot(turn);
        });

        this.game.addMessage(`[i18n] Characters ${_.join(_.map(characters, a => `${a.id} (${a.initiative})`), ' vs ')}`);
        let winner = _.maxBy(characters, a => a.initiative + (this.game.underdog === a.owner ? 0.1 : 0));
        this.game.addMessage(`[i18n] Initiative winner is [[character]]`, {character: winner});

        let choices = _.map(characters, character => ({
        	message: "[i18n] [[character]]",
        	args: {
        		character: character
        	}
        }));

        let handlers = _.map(characters, character => (() => {
        	this.game.addMessage('game.phases.turns.order.selected', {
    			player: winner.owner,
    			character: character
    		});
    		
        	let orderedCharacters = [character].concat(_.reject(characters, {uuid: character.uuid}));
        	_.each(orderedCharacters, character => {
        		this.game.queueStep(new CharacterActivation(this.game, character));
        	});
        }));

        this.game.promptWithHandlerMenu(winner.owner, {
        	activePromptTitle: 'game.phases.turns.order.titles.active',
        	waitingPromptTitle: 'game.phases.turns.order.titles.waiting',
        	choices: choices,
        	handlers: handlers
        });
    }
}


module.exports = TurnsPhase;
