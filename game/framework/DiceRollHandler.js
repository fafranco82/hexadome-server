const _ = require('lodash');

const BaseStepWithPipeline = require('./basestepwithpipeline.js');
const SimpleStep = require('./SimpleStep');

const ApplySwitchesPrompt = require('./prompt/ApplySwitchesPrompt');

const Die = require('../Die');

const { Stages, RollTypes, Symbols } = require('../Constants');

class DiceRollHandler extends BaseStepWithPipeline {
	constructor(game, properties) {
		super(game);

		this.context = properties.context;
		this.type = properties.type || RollTypes.Simple;
		this.activePlayer = properties.activePlayer || this.context.player;

		this.activeDice = properties.activeDice || (() => ([]));
		this.otherDice = properties.otherDice || (() => ([]));

		if(this.type === RollTypes.FaceToFace && this.context.target) {
			this.otherPlayer = this.context.target.owner;
		}

		this.initialise();
	}

	getPlayers() {
		return [this.activePlayer].concat(this.otherPlayer ? [this.otherPlayer] : []);
	}

	initialise() {
		this.pipeline.initialise([
			new SimpleStep(this.game, () => this.prepareTrays()),
			new SimpleStep(this.game, () => this.roll()),
			new SimpleStep(this.game, () => this.switches()),
			new SimpleStep(this.game, () => this.resolution()),
			new SimpleStep(this.game, () => this.clearTrays())
		]);
	}

	pause() {
		this.game.promptWithHandlerMenu(this.activePlayer, {
            activePromptTitle: '[i18n] Pause',
            choices: ['[i18n] Continue'],
            handlers: [
                () => {
                    return true;
                }
            ]
        });
	}

	prepareTrays() {
		this.context.stage = Stages.Roll;

		this.activePlayer.getDiceTray().setDice(this.activeDice(this.context, this.activePlayer));

		if(this.otherPlayer) {
			this.otherPlayer.getDiceTray().setDice(this.otherDice(this.context, this.otherPlayer));
		}

		this.pause();
	}

	roll() {
		//make roll		
		_.each(this.getPlayers(), player => {
			player.getDiceTray().rollAll();
		});

		this.pause();
	}

	switches() {
		//collect symbols
		_.each(this.getPlayers(), player => {
			player.getDiceTray().collectSymbols();
			player.getDiceTray().clearDice();
		});

		let players = this.getPlayers();

		if(players.length > 1) {
			this.game.promptWithHandlerMenu(this.activePlayer, {
				promptTitle: 'game.prompts.switches.titles.prompt',
				activePromptTitle: 'game.prompts.switches.titles.order.active',
				waitingPromptTitle: 'game.prompts.switches.titles.order.waiting',
				choices: _.map(players, player => ({
					message: '@[[player]]',
					args: {player: player}
				})),
				handlers: [
					() => this.queueSwitchesPrompt(players),
					() => this.queueSwitchesPrompt(_.reverse(players))
				]
			});
		} else {
			this.queueSwitchesPrompt(players);
		}
	}

	queueSwitchesPrompt(players) {
		//make switches
		_.each(players, player => {
			let switches = [];

			if(player === this.activePlayer) {
				switches = this.context.source.getSwitches().concat(this.context.action.switches);
			} else {
				switches = this.context.target.getSwitches();
			}

			this.game.queueStep(new ApplySwitchesPrompt(this.game, player, {
				context: this.context,
				switches: switches
			}));
		});
	}

	resolution() {
		if(this.type === RollTypes.FaceToFace && this.otherPlayer) {
			//for every block gotten by a player, remove one success from the opponent
			_.each(this.getPlayers(), player => {
				let blocks = _.filter(player.getDiceTray().getSymbols(), symbol => _.includes([Symbols.Block, Symbols.CritialBlock], symbol));
				let successes = _.filter(player.opponent.getDiceTray().getSymbols(), symbol => symbol === Symbols.Success);
				let toRemove = _.min([blocks.length, successes.length]);
				player.getDiceTray().removeSymbols(_.take(blocks, toRemove));
				player.opponent.getDiceTray().removeSymbols(_.take(successes, toRemove));
			});
		}

		_.each(this.getPlayers(), player => {
			this.context.rolls[player.name] = player.getDiceTray().getSymbols();


			this.game.addMessage(`[i18n] [[player]] rolled ${_.join(this.context.rolls[player.name], ', ')}`, {
				player: player
			});
		});
	}

	clearTrays() {
		_.each(this.getPlayers(), player => {
			player.getDiceTray().clearSymbols();
		});
	}
}

module.exports = DiceRollHandler;
