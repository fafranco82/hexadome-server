const _ = require('lodash');

const GameObject = require('./GameObject');

const { DieColors, Symbols } = require('./Constants');

const Sides = {
	[DieColors.Red]: [
		[Symbols.CriticalSuccess],
		[Symbols.Success, Symbols.Special],
		[Symbols.Success, Symbols.Special],
		[Symbols.Success],
		[Symbols.Success, Symbols.Success, Symbols.Special],
		[]
	],
	[DieColors.Green]: [
		[Symbols.CritialBlock],
		[Symbols.Block, Symbols.Block, Symbols.Special],
		[Symbols.Block, Symbols.Special],
		[Symbols.Block],
		[],
		[]
	],
	[DieColors.Orange]: [
		[Symbols.Success, Symbols.Success, Symbols.Special],
		[Symbols.Success],
		[Symbols.Success, Symbols.Block],
		[Symbols.Success, Symbols.Block, Symbols.Special],
		[Symbols.Block],
		[]
	],
	[DieColors.Blue]: [
		[Symbols.Block, Symbols.Block, Symbols.Special],
		[Symbols.Success, Symbols.Block, Symbols.Special],
		[Symbols.Success, Symbols.Block],
		[Symbols.Block],
		[Symbols.Success],
		[]
	],
	[DieColors.Yellow]: [
		[Symbols.Success, Symbols.Block, Symbols.Special],
		[Symbols.Success, Symbols.Special, Symbols.Special],
		[Symbols.Block, Symbols.Special],
		[Symbols.Special],
		[Symbols.Special],
		[]
	],
	[DieColors.Black]: [
		[Symbols.Block],
		[Symbols.Block],
		[Symbols.Block],
		[],
		[],
		[]
	]
};

class Die extends GameObject {
	constructor(game, owner, color) {
		super(game, color);
		
		this.owner = owner;
		this.type = 'die';

		this.buildSides(color);

		this.rolled = 0;
	}

	buildSides(color) {
		if(_.includes(DieColors, color)) {
			this.color = color;
			this.sides = _.map(Sides[this.color], (symbols, index) => ({side: index, symbols: symbols}));
		} else if(_.includes(Symbols, color)) {
			this.color = 'symbol';
			this.sides = [{side: color, symbols: [color]}];
		} else {
			throw new Error(`tried to make a die without valid color or symbol: ${color}`);
		}
		
		this.shown = _.last(this.sides);
	}

	canBeRolled() {
		if(this.color === 'symbol') {
			return false;
		}

		return this.rolled <= 2;
	}

	roll() {
		this.rolled++;
		this.shown = _.sample(this.sides);
	}

	getState(activePlayer) {
		let state = {
			uuid: this.uuid,
			color: this.color,
			side: this.shown.side
		};

		return state;
	}
}

module.exports = Die;
