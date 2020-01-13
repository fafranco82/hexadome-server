class BaseStep {
    constructor(game) {
        this.game = game;
    }

    continue() {

    }

    onCardClicked() {
        return false;
    }

    onHexClicked() {
        return false;
    }

    onPieceClicked() {
        return false;
    }

    onMenuCommand() {
        return false;
    }

    getDebugInfo() {
        return this.constructor.name;
    }
}

module.exports = BaseStep;
