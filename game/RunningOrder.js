const _ = require('lodash');

class Slot {
	constructor(slotNumber) {
		this.slotNumber = slotNumber;
		this.aristo = undefined;
		this.revealed = false;
	}

	setAristo(aristo) {
		this.aristo = aristo;
		this.revealed = false;
	}

	getAristo() {
		return this.aristo;
	}

	hasAristo(aristo) {
		return this.isSet() && this.aristo.uuid === aristo.uuid;
	}

	reveal() {
		this.revealed = true;
	}

	isRevealed() {
		return this.revealed;
	}

	clearSlot() {
		this.aristo = undefined;
	}

	isSet() {
		return typeof this.aristo !== 'undefined';
	}
}

class RunningOrder {
	constructor(player) {
		this.player = player;

		this.slots = _.map(_.range(4), slotNumber => new Slot(slotNumber));
		this.currentTurn = -1;
	}

	revealSlot(slotNumber) {
		this.slots[slotNumber].reveal();
		this.currentTurn = slotNumber;
	}

	getSlot(slotNumber) {
		return this.slots[slotNumber].getAristo();
	} 

	setSlot(slotNumber, aristo) {
		let previousSlot = this.slots.find(slot => slot.hasAristo(aristo));
		if(previousSlot) {
			previousSlot.clearSlot();
		}
		this.slots[slotNumber].setAristo(aristo);
	}

	isFullySet() {
		return _.every(this.slots, s => s.isSet());
	}

	copyRunningOrder(runningOrder) {
		_.each(_.range(4), slotNumber => {
			this.setSlot(slotNumber, runningOrder.getSlot(slotNumber));
		});
	}

	getState(activePlayer) {
		return _.map(this.slots, slot => {
			if(!slot.isSet()) {
				return {};
			}

			if(!slot.isRevealed() && activePlayer !== this.player) {
				return {
					facedown: true,
					current: slot.slotNumber === this.currentTurn,
				};
			}

			let aristo = slot.getAristo();
			return {
				id: aristo.id,
				uuid: aristo.uuid,
				initiative: aristo.initiative,
				current: slot.slotNumber === this.currentTurn,
				revealed: slot.isRevealed()
			};
		});
	}
}

module.exports = RunningOrder;
