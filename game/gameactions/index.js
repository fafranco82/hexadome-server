
const AddMovementPointsAction = require('./AddMovementPointsAction');

const PlacePieceAction = require('./PlacePieceAction');
const DisplacePieceAction = require('./DisplacePieceAction');
const ImposeStateAction = require('./ImposeStateAction');

const GameActions = {
	//characters
	addMovementPoints: (propertyFactory) => new AddMovementPointsAction(propertyFactory),
	//pieces
	place: (propertyFactory) => new PlacePieceAction(propertyFactory),
	displace: (propertyFactory) => new DisplacePieceAction(propertyFactory),
	imposeState: (propertyFactory) => new ImposeStateAction(propertyFactory)
};

module.exports = GameActions;
