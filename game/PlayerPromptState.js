const _ = require('lodash');
const i18n = require('../i18n');

const MessageFormatter = require('./helpers/MessageFormatter');

class PlayerPromptState {
    constructor() {
        this.active = false;

        this.menuTitle = '';
        this.promptTitle = '';
        this.buttons = [];
        this.controls = [];

        this.selectHex = false;
        this.selectableHexes = [];
        this.selectedHexes = [];

        this.selectPiece = false;
        this.selectablePieces = [];
        this.selectedPieces = [];
    }

    setPrompt(prompt) {
        this.active = true;

        this.selectHex = prompt.selectHex || false;
        this.selectPiece = prompt.selectPiece || false;

        this.menuTitle = this.buildTitle(prompt.menuTitle || '');
        this.promptTitle = this.buildTitle(prompt.promptTitle || '');
        this.buttons = _.map(prompt.buttons || [], button => this.buildButton(button));

        this.controls = prompt.controls || [];
    }

    buildTitle(title) {
        if(!title) {
            return title;
        }

        if(!_.isObject(title)) {
            return {message: title};
        }

        if(title.args) {
            title.args = MessageFormatter.formatArgs(title.args);
        } else {
            title.args = {};
        }

        return title;
    }

    buildButton(button) {
        if(_.isString(button.text)) {
            button.text = {message: button.text, args:{}};
        } else if(button.text.args) {
            button.text.args = MessageFormatter.formatArgs(button.text.args);
        }

        return button;
    }

    cancelPrompt() {
        this.active = false;
        this.menuTitle = '';
        this.buttons = [];
        this.controls = [];
    }

    setSelectedHexes(hexes) {
        this.selectedHexes = hexes;
    }

    clearSelectedHexes() {
        this.selectedHexes = [];
    }

    setSelectableHexes(hexes) {
        this.selectableHexes = hexes;
    }

    clearSelectableHexes() {
        this.selectableHexes = [];
    }

    getHexSelectionState(hex) {
        let selectable = _.filter(this.selectableHexes, h => hex.x===h.x && hex.y===h.y).length > 0;
        let index = _.findIndex(this.selectedHexes, h => hex.x===h.x && hex.y===h.y);

        return {
            selected: index !== -1,
            selectable: selectable,
            unselectable: (this.selectHex && !selectable) || (this.selectPiece && _.isEmpty(hex.content))
        };
    }

    setSelectedPieces(pieces) {
        this.selectedPieces = pieces;
    }

    clearSelectedPieces() {
        this.selectedPieces = [];
    }

    setSelectablePieces(pieces) {
        this.selectablePieces = pieces;
    }

    clearSelectablePieces() {
        this.selectablePieces = [];
    }

    getPieceSelectionState(piece) {
        let selectable = _.includes(this.selectablePieces, piece);
        let index = _.indexOf(this.selectedPieces, piece);
        
        return {
            selected: index !== -1,
            selectable: selectable,
            unselectable: this.selectPiece && !selectable
        };
    }

    getState(player) {
        const t = i18n.getFixedT(player.user.locale);
        return {
            active: this.active,
            menuTitle: this.menuTitle ? MessageFormatter.getFragments(this.menuTitle.message, this.menuTitle.args, t) : '',
            promptTitle: this.promptTitle ? MessageFormatter.getFragments(this.promptTitle.message, this.promptTitle.args, t) : '',
            buttons: this.buttons.map(button => this.getButtonState(button, t)),
            controls: this.controls
        };
    }

    getButtonState(button, t) {
        button = Object.assign({}, button, {
            text: MessageFormatter.getFragments(button.text.message, button.text.args || {}, t)
        });

        if(button.disabled) {
            let disabled = typeof button.disabled === 'function' ? button.disabled() : button.disabled;
            return Object.assign({}, button, { disabled: !!disabled });
        }
        return button;
    }
}

module.exports = PlayerPromptState;
