const _ = require('lodash');

const AllPlayerPrompt = require('../../prompt/AllPlayerPrompt');

const RunningOrder = require('../../../RunningOrder');

class RunningOrderSelectionPrompt extends AllPlayerPrompt {
	constructor(game) {
		super(game);

		this.runningOrders = {};
		this.selectingSlot = {};
		_.each(game.getPlayers(), player => {
			this.runningOrders[player.name] = new RunningOrder(player);
			this.selectingSlot[player.name] = undefined;
		});

		this.completedPlayers = new Set();
	}

	completionCondition(player) {
		return this.completedPlayers.has(player);
	}

	isSelectingSlot(player) {
		return typeof this.selectingSlot[player.name] !== 'undefined';
	}

	getSelectingSlot(player) {
		return this.selectingSlot[player.name];
	}

	setSelectingSlot(player, slotNumber) {
		this.selectingSlot[player.name] = slotNumber;
	}

	getRunningOrder(player) {
		return this.runningOrders[player.name];
	}

	activePrompt(player) {
		if(this.isSelectingSlot(player)) {
			let buttons = _.map(player.characters, character => ({
				arg: character.uuid,
				text: {
					message: 'game.prompts.common.titles.source',
					args: {
						source: character
					}
				}
			}));

			return {
				promptTitle: 'game.prompts.runningorder.titles.prompt',
				menuTitle: 'game.prompts.runningorder.titles.active.selectcharacter',
				buttons: buttons
			};
		} else {
			let buttons = _.map(_.range(4), slotNumber => {
				let props = { arg: slotNumber };
				let character = this.getRunningOrder(player).getSlot(slotNumber);
				if(character) {
					props.text = {
						message: 'game.prompts.runningorder.slotselected',
						args: {
							slot: slotNumber+1,
							character: character,
							initiative: character.initiative
						}
					};
				} else {
					props.text = {
						message: 'game.prompts.runningorder.slotunselected',
						args: {
							slot: slotNumber+1
						}
					};
				}
				return props;
			}).concat([{ arg: 'done', text: {message: 'game.prompts.common.buttons.done'}}]);

			return {
				promptTitle: 'game.prompts.runningorder.titles.prompt',
				menuTitle: 'game.prompts.runningorder.titles.active.selectslot',
				buttons: buttons
			};
		}
	}

	waitingPrompt() {
		return {
			promptTitle: 'game.prompts.runningorder.titles.prompt',
	        menuTitle: 'game.prompts.common.titles.waiting',
	        buttons: [{arg: 'cancel', text: {message: 'game.prompts.common.buttons.cancel'}}]
	    };
	}

	onMenuCommand(player, arg) {
		if(this.completionCondition(player)) {
			if(arg === 'cancel') {
				this.completedPlayers.delete(player);
				this.game.addMessage('game.prompts.runningorder.playercancel', {
	                player: player
	            });
				return true;
			}
			return false;
		}

		if(this.isSelectingSlot(player)) {
			//arg is character uuid
			let character = player.getAristos().find(a => a.uuid === arg);
			if(character) {
				this.getRunningOrder(player).setSlot(this.getSelectingSlot(player), character);
				this.setSelectingSlot(player, undefined);
				return true;
			}
		} else {
			//arg is 'done' or slot number
			if(arg === 'done') {
				if(!this.getRunningOrder(player).isFullySet()) {
					return false;
				}
				this.completedPlayers.add(player);
				this.game.addMessage('game.prompts.runningorder.playerdone', {
	                player: player
	            });
				return true;
			}

			this.setSelectingSlot(player, arg);
			return true;
		}

		return false;
	}

	onCompleted() {
		_.each(this.game.getPlayers(), player => {
			player.setRunningOrder(this.getRunningOrder(player));
		});
	}
}

module.exports = RunningOrderSelectionPrompt;
