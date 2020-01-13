const _ = require('lodash');
const Honeycomb = require('honeycomb-grid');
const {polygonScale, lineIntersectsPolygon} = require('geometric');

const Hex = Honeycomb.extendHex({
    orientation: "flat",
    toPoints: function() {
    	let pos = this.toPoint();
    	return this.corners().map(({x, y}) => ([x+pos.x, y+pos.y]));
    }
});

const Grid = Honeycomb.defineGrid(Hex);

const HexToScoringZone = {
	"8,16": 1, "8,17": 1, "9,15": 1, "9,16": 1, "9,17": 1, "10,16": 1, "10,17": 1,
	"1,12": 2, "1,13": 2, "2,12": 2, "2,13": 2, "2,14": 2, "3,12": 2, "3,13": 2,
	"1,5": 3, "1,6": 3, "2,5": 3, "2,6": 3, "2,7": 3, "3,5": 3, "3,6": 3,
	"8,2": 4, "8,3": 4, "9,1": 4, "9,2": 4, "9,3": 4, "10,2": 4, "10,3": 4, 
	"15,5": 5, "15,6": 5, "16,5": 5, "16,6": 5, "16,7": 5, "17,5": 5, "17,6": 5,
	"15,12": 6, "15,13": 6, "16,12": 6, "16,13": 6, "16,14": 6, "17,12": 6, "17,13": 6,
	"8,9": "center", "8,10": "center", "9,8": "center", "9,9": "center", "9,10": "center", "10,9": "center", "10,10": "center"
};

class GameBoard {
	constructor(game) {
		this.game = game;

		this.grid = Grid.hexagon({
            radius: 9,
            center: [9, 9],
            onCreate: function(hex) {
            	hex.content = [];
            }
        });

        this.blockedSpaces = [];
        this.obstacles = [];
	}

	initialise() {
		let BlockedSpace = require('./BlockedSpace');
		let Barrier = require('./Barrier');
		"1,8;2,9;2,10;3,4;3,10;4,7;5,13;6,3;6,4;6,15;7,9;8,6;8,12;9,4;9,11;9,14;10,8;10,15;12,11;13,4;13,6;13,7;13,11;14,8;14,14;14,15;15,10;16,10".split(/;/).forEach(coor => {
			let [x, y] = coor.split(',').map(n => parseInt(n, 10));
			let blocked = new BlockedSpace(this.game);
			this.placeAt(blocked, {x: x, y: y});
			this.blockedSpaces.push(blocked);
		});
		"5,10;6,11;9,7;11,5;11,12".split(/;/).forEach(coor => {
			let [x, y] = coor.split(',').map(n => parseInt(n, 10));
			let barrier = new Barrier(this.game);
			this.placeAt(barrier, {x: x, y: y});
			this.obstacles.push(barrier);
		});
	}

	getHexes() {
		return this.grid.map(({x,y}) => ({x, y}));
	}

	existsHex(position) {
		let hex = this.grid.get(position);
		return !!hex;
	}

	isFree(position) {
		return _.every(this.getContents(position), piece => !piece.blocksMovement);
	}

	areAdjacents(position1, position2) {
		return Hex(position1).distance(Hex(position2)) === 1;
	}

	placeAt(piece, position) {
		this.removePieceFromBoard(piece);

		this.grid.get(position).content.push(piece);
		piece.placeAt(position);
	}

	removePieceFromBoard(piece) {
		let originalPosition =  piece.position;
		let originalContent = this.getContents(originalPosition);

		if(originalContent) {
			originalContent = this.removePieceByUuid(originalContent, piece.uuid);
			this.updateContents(originalPosition, originalContent);
		}
	}

	getDestinationsFrom(position) {
		let neighbours = this.grid.neighborsOf(this.grid.get(position)).filter(hex => hex && _.every(hex.content, piece => !piece.blocksMovement()));
		return _.map(neighbours, n => ({x: n.x, y: n.y}));
	}

	getContents(position) {
		return !!position ? this.grid.get(position).content : [];
	}

	removePieceByUuid(content, uuid) {
		return _.reject(content, piece => piece.uuid === uuid);
	}

	arePiecesAtRange(piece1, piece2, range) {
		let distance = Hex(piece1.position).distance(Hex(piece2.position));
		return _.inRange(distance, range[0], range[1]+1);
	}

	lineOfSightType(piece1, piece2) {
		let hex1 = Hex(piece1.position);
        let hex2 = Hex(piece2.position);

        let blocks = _.reduce(this.grid.hexesBetween(hex1, hex2), (list, hex) => {
        	return list.concat(this.grid.neighborsOf(hex)).concat([hex]);
        }, []);
        blocks = _.filter(blocks, hex => hex && _.some(hex.content, piece => piece.blocksLineOfSight()) && !hex.equals(hex2) && !hex.equals(hex1));
        blocks = _.uniqBy(blocks, ({x,y}) => `${x}-${y}`);

        let polygons = blocks.map(hex => {
        	return polygonScale(hex.toPoints(), 0.99);
        });

        //Tracing lines from hex1 corners
        let linesTraced = hex1.toPoints().map(p1 => {
        	return 6 - hex2.toPoints().filter(p2 => {
        		return _.some(polygons, polygon => lineIntersectsPolygon([p1, p2], polygon));
        	}).length;
        });

        if(_.includes(linesTraced, 6)) {
        	return 'clear';
        } else if(_.some(linesTraced, n => n >= 2)) {
        	return 'limited';
        } else {
        	return 'blocked';
        }
	}

	hasLineOfSight(piece1, piece2) {
		return this.lineOfSightType(piece1, piece2) !== 'blocked';
	}

	updateContents(position, contents) {
		if(position) {
			this.grid.get(position).content = contents;
		}
	}

	isScoringZone(position) {
		return _.has(HexToScoringZone, `${position.x},${position.y}`);
	}

	isActiveScoringZone(position) {
		return HexToScoringZone[`${position.x},${position.y}`] === this.game.activeScoringZone;
	}

	// SUMMARY
	getSummary(activePlayer) {
		return JSON.stringify(this.grid.map(hex => {
			let selectionState = activePlayer.getHexSelectionState(hex);

			return Object.assign({
				x: hex.x, 
				y: hex.y,
				scoring: this.isScoringZone(hex),
				activeScoring: this.isActiveScoringZone(hex),
				content: hex.content.map(piece => piece.getSummary(activePlayer))
			}, selectionState);
		}));
	}
}

module.exports = GameBoard;
