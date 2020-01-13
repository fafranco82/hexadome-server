const _ = require('lodash');

class User {
    constructor(userData) {
        this.userData = userData;
    }

    get _id() {
        return this.userData._id;
    }

    get username() {
        return this.userData.username;
    }

    get email() {
        return this.userData.email;
    }

    get password() {
        return this.userData.password;
    }

    get gravatar() {
        return this.userData.gravatar;
    }

    get locale() {
        return this.userData.locale;
    }

    get gender() {
        return this.userData.gender;
    }

    getWireSafeDetails() {
        let user = _.omit(this.userData, 'password');

        return user;
    }

    getShortSummary() {
        return _.pick(this.userData, ['username']);
    }

    getDetails() {
        let user = _.omit(this.userData, ['password']);

        delete user.password;
        delete user.tokens;

        //user = Settings.getUserWithDefaultsSet(user);

        return user;
    }

    formatAsMessageArg() {
        return {arg: 'user', name: this.username, gravatar: this.gravatar};
    }
}

module.exports = User;
