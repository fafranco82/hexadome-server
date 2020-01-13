const _ = require('lodash');

const GameObject = require('./GameObject');
const PlayerPromptState = require('./PlayerPromptState');
const DiceTray = require('./DiceTray');
const RunningOrder = require('./RunningOrder');

const Lineup = require('./Lineup');

class Player extends GameObject {
    constructor(id, user, owner, game) {
        super(game, user.username);

        this.id = id;
        this.user = user;
        this.owner = owner;
        this.type = 'player';

        this.lineup = {};

        this.disconnected = false;
        this.left = false;

        this.diceTray = new DiceTray(game, this);
        this.runningOrder = new RunningOrder(this);
        this.characters = [];

        this.promptState = new PlayerPromptState(this);
    }

    isSpectator() {
        return false;
    }

    initialise() {
        this.opponent = this.game.getOtherPlayer(this);

        this.prepareLineup();

        const coors = [
            [9,2],
            [8,3],
            [9,3],
            [10,3]
        ];

        const replaceCoors = {
            'miyamoto-mushashi': [6, 10],
            'parvati': [6, 12]
        };

        _.each(_.zip(this.characters, coors), ([character, [x,y]]) => {
            if(this.team == 'green') y = y+13;
            if(_.has(replaceCoors, character.id)) {
                [x,y] = replaceCoors[character.id];
            }
            this.game.gameBoard.placeAt(character, {x: x, y: y});
        });
    }

    prepareLineup() {
        let lineup = new Lineup(this.lineup);
        let chars = lineup.prepare(this).characters;

        let byTeams = {
            orange: [
                'miyamoto-mushashi',
                'wild-bill',
                '8-ball',
                'gata',
            ],
            green: [
                'parvati',
                'maximus',
                'major-lunah',
                'hexx3r',
            ]
        };
        let aristos = byTeams[this.team];
        let fixed = _(chars).filter(ch => _.includes(aristos, ch.id)).sortBy(ch => _.indexOf(aristos, ch.id)).value();
        let notFixed = _.reject(chars, ch => _.includes(fixed, ch));
        
        _.each(fixed.concat(_.sampleSize(notFixed, 4-fixed.length)), character => {
            this.characters.push(character);
        });
    }

    // ACTIONS
    selectLineup(lineup) {
        this.lineup.selected = false;
        this.lineup.chars = lineup;
        this.lineup.selected = true;
    }

    movePiece(piece, position) {
        this.game.gameBoard.placeAt(piece, position);
    }

    // GETTERS & SETTERS
    getDiceTray() {
        return this.diceTray;
    }
    
    setRunningOrder(runningOrder) {
        this.runningOrder.copyRunningOrder(runningOrder);
    }

    // PROMPT
    currentPrompt() {
        return this.promptState.getState(this);
    }

    setPrompt(prompt) {
        this.promptState.setPrompt(prompt);
    }

    cancelPrompt() {
        this.promptState.cancelPrompt();
    }

    setSelectedHexes(hexes) {
        this.promptState.setSelectedHexes(hexes);
    }

    getSelectedHexes() {
        return this.promptState.selectedHexes;
    }

    clearSelectedHexes() {
        this.promptState.clearSelectedHexes();
    }

    setSelectableHexes(hexes) {
        this.promptState.setSelectableHexes(hexes);
    }

    getSelectableHexes() {
        return this.promptState.selectableHexes;
    }

    clearSelectableHexes() {
        return this.promptState.clearSelectableHexes();
    }

    getHexSelectionState(hex) {
        return this.promptState.getHexSelectionState(hex);
    }

    setSelectedPieces(pieces) {
        this.promptState.setSelectedPieces(pieces);
    }

    getSelectedPieces() {
        return this.promptState.selectedPieces;
    }

    clearSelectedPieces() {
        this.promptState.clearSelectedPieces();
    }

    setSelectablePieces(pieces) {
        this.promptState.setSelectablePieces(pieces);
    }

    getSelectablePieces() {
        return this.promptState.selectablePieces;
    }

    clearSelectablePieces() {
        return this.promptState.clearSelectablePieces();
    }

    getPieceSelectionState(piece) {
        return this.promptState.getPieceSelectionState(piece);
    }

    // SUMMARY
    getState(activePlayer) {
        let isActivePlayer = activePlayer == this;
        let promptState = isActivePlayer ? this.currentPrompt() : {active: false};

        let state = {
            id: this.id,
            left: this.left,
            disconnected: this.disconnected,
            name: this.name,
            team: this.team,
            gravatar: this.user.gravatar,
            user: _.pick(this.user, ['username']),
            phase: this.phase,
            characters: _.map(this.characters, character => character.getState(activePlayer)),
            diceTray: this.diceTray.getState(activePlayer),
            runningOrder: this.runningOrder.getState(activePlayer),
            prompt: promptState
        };

        return state;
    }

    formatAsMessageArg() {
        return {arg: 'player', name: this.name, gravatar: this.user.gravatar, team: this.team};
    }
}

module.exports = Player;
