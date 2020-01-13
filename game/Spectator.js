class Spectator {
    constructor(id, user) {
        this.user = user;
        this.name = this.user.username;
        this.gravatar = this.user.gravatar;
        this.id = id;
    }

    getCardSelectionState() {
        return {};
    }

    isSpectator() {
        return true;
    }

    formatAsMessageArg() {
        return {arg: 'player', name: this.name, gravatar: this.gravatar};
    }
}

module.exports = Spectator;
