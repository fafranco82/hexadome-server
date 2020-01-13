const monk = require('monk');

const config = require('config');
const User = require('../models/User');
const logger = require('../logger');
const {escapeRegex } = require('../utils');

class UserService {
    constructor(dbInstance) {
        let db = dbInstance || monk(config.get('database.url'));
        this.users = db.get('users');
    }

    getUsers() {
        return this.users.find({});
    }

    getUserByUsername(username) {
        return this.users.find({
            username: {
                '$regex': new RegExp('^' + escapeRegex(username.toLowerCase()) + '$', 'i')
            }
        }).then(users => {
            return users[0] && new User(users[0]);
        }).catch(err => {
            logger.error(`Error fetching users: ${err}`);

            throw new Error('Error ocurred fetching users');
        });
    }

    getUserByEmail(email) {
        return this.users.find({
            email: {
                '$regex': new RegExp('^' + escapeRegex(email.toLowerCase()) + '$', 'i')
            }
        }).then(users => {
            return users[0] && new User(users[0]);
        }).catch(err => {
            logger.error(`Error fetching users: ${err}`);

            throw new Error('Error ocurred fetching users');
        });
    }

    getUserById(id) {
        return this.users.find({ _id: id })
            .then(users => {
                return users[0] && new User(users[0]);
            })
            .catch(err => {
                logger.error(`Error fetching users: ${err}`);

                throw new Error('Error ocurred fetching users');
            });
    }

    addUser(user) {
        return this.users.insert(user)
            .then(() => {
                return new User(user);
            })
            .catch(err => {
                logger.error(`Error adding user ${user}: ${err}`);

                throw new Error('Error ocurred adding user');
            });
    }

    getWireSafeDetails(userData) {
        let user = {
            _id: userData._id,
            username: userData.username,
            email: userData.email
        };

        return user;
    }

    getSummary(userData) {
        let user = {
            name: userData.username
        };

        return user;
    }
}

module.exports = UserService;
