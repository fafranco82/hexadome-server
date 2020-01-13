const ExactlyXHexSelector = require('./selectors/ExactlyXHexSelector');
const SingleHexSelector = require('./selectors/SingleHexSelector');
const UnlimitedHexSelector = require('./selectors/UnlimitedHexSelector');
const UpToXHexSelector = require('./selectors/UpToXHexSelector');

const { TargetModes } = require('./Constants');

const defaultProperties = {
	numHexes: 1,
	hexCondition: () => true,
	multiSelect: false
};

const ModeToSelector = {
	exactly: p => new ExactlyXHexSelector(p.numHexes, p),
    single: p => new SingleHexSelector(p),
    unlimited: p => new UnlimitedHexSelector(p),
    upTo: p => new UpToXHexSelector(p.numHexes, p)
}

class HexSelector {
	static for(properties) {
		properties = HexSelector.getDefaultProperties(properties);

		let factory = ModeToSelector[properties.mode];

		if(!factory) {
			throw new Error(`Unknown hex selector mode of ${properties.mode}`);
		}

		return factory(properties);
	}

	static getDefaultProperties(properties) {
		properties = Object.assign({}, defaultProperties, properties);
		if(properties.mode) {
			return properties;
		}

		if(properties.numHexes === 1 && !properties.multiSelect) {
			properties.mode = TargetModes.Single;
		} else if(properties.numHexes === 0) {
			properties.mode = TargetModes.Unlimited;
		} else {
			properties.mode = TargetModes.UpTo;
		}

		return properties;
	}
}

module.exports = HexSelector;
