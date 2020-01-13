

const Costs = {
	actionPoints: (amount) => ({
		canPay: context => context.source.actionPoints >= amount,
		pay: context => context.source.actionPoints -= amount
	}),
	movementPoints: (amount) => ({
		canPay: context => context.source.movementPoints >= amount,
		pay: context => context.source.movementPoints -= amount
	}),
	symbols: (symbols) => ({
		canPay: context => context.player.getDiceTray().hasSymbols(symbols),
		pay: context => context.player.getDiceTray().removeSymbols(symbols)
	})
};

module.exports = Costs;
