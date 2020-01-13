const _ = require('lodash');

const Die = require('./Die');

const { DieColors, Symbols, SymbolsOrder } = require('./Constants');

class DiceTray {
	constructor(game, player) {
		this.game = game;
		this.player = player;

		this.dice = [];
		this.symbols = [];
	}

	getDice() {
		return this.dice;
	}

	addDie(color) {
		if(this.canAddDie(color)) {
			this.dice.push(new Die(this.game, this.player, color));
		}
	}

	canAddDie(color) {
		if(_.includes(DieColors, color)) {
			let currentCount = _.filter(this.dice, {name: color}).length;
			let threshold = _.includes([DieColors.Red, DieColors.Green], color) ? 1 : 3;
			return currentCount < threshold;
		} else if(!_.includes(Symbols, color)) {
			return false;
		}

		return true;
	}

	addDice(colors) {
		_.each(colors, color => this.addDie(color));
	}

	setDice(colors) {
		this.clearDice();
		this.addDice(colors);
	}

	clearDice() {
		this.dice = [];
	}

	rollDie(dieId) {
		let die = _.find(this.dice, die => die.uuid === dieId);

		if(!die || !die.canBeRolled()) {
			return;
		}

		die.roll();
	}

	rollAll() {
		_(this.dice).filter(die => die.canBeRolled()).each(die => {
			die.roll();
		});
	}

	removeDie(dieId) {
		this.dice = _.reject(this.dice, die => die.uuid === dieId);
	}

	getSymbols() {
		return this.symbols;
	}

	collectSymbols() {
		this.symbols = _(this.dice)
			.map(die => die.shown.symbols)
			.flattenDeep()
			.sortBy(symbol => _.indexOf(SymbolsOrder, symbol))
			.value();
	}

	clearSymbols() {
		this.symbols = [];
	}

	hasSymbols(symbols) {
		if(!Array.isArray(symbols)) {
			symbols = [symbols];
		}

		let current = _.countBy(this.symbols);
		let required = _.countBy(symbols);

		return _.every(required, (n, symbol) => current[symbol] >= n);
	}

	removeSymbols(symbols) {
		if(!Array.isArray(symbols)) {
			symbols = [symbols];
		}

		_.each(symbols, symbol => this.symbols.splice(_.indexOf(this.symbols, symbol), 1));
	}

	getState(activePlayer) {
		let state = {
			dice: _.map(this.dice, die => die.getState(activePlayer)),
			symbols: this.symbols
		};

		return state;
	}
}

module.exports = DiceTray;
