const ExactlyXPieceSelector = require('./selectors/ExactlyXPieceSelector');
const SinglePieceSelector = require('./selectors/SinglePieceSelector');
const UnlimitedPieceSelector = require('./selectors/UnlimitedPieceSelector');
const UpToXPieceSelector = require('./selectors/UpToXPieceSelector');

const { TargetModes } = require('./Constants');

const defaultProperties = {
	numPieces: 1,
	pieceCondition: () => true,
	multiSelect: false
};

const ModeToSelector = {
	exactly: p => new ExactlyXPieceSelector(p.numPieces, p),
    single: p => new SinglePieceSelector(p),
    unlimited: p => new UnlimitedPieceSelector(p),
    upTo: p => new UpToXPieceSelector(p.numPieces, p)
}

class PieceSelector {
	static for(properties) {
		properties = PieceSelector.getDefaultProperties(properties);

		let factory = ModeToSelector[properties.mode];

		if(!factory) {
			throw new Error(`Unknown piece selector mode of ${properties.mode}`);
		}

		return factory(properties);
	}

	static getDefaultProperties(properties) {
		properties = Object.assign({}, defaultProperties, properties);
		if(properties.mode) {
			return properties;
		}

		if(properties.numPieces === 1 && !properties.multiSelect) {
			properties.mode = TargetModes.Single;
		} else if(properties.numPieces === 0) {
			properties.mode = TargetModes.Unlimited;
		} else {
			properties.mode = TargetModes.UpTo;
		}

		return properties;
	}
}

module.exports = PieceSelector;
