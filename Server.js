const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const passportJwt = require('passport-jwt');
const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;
const http = require('http');
const helmet = require('helmet');
const monk = require('monk');

const config = require('config');
const logger = require('./logger');
const api = require('./api');

const UserService = require('./services/UserService.js');

class Server {
    constructor(isDeveloping, options={}) {
        this.isDeveloping = isDeveloping;
        this.server = http.Server(app);
        this.options = options;

        let db = monk(config.get('database.url'));
        this.userService = new UserService(db);
    }

    init() {


        app.use(helmet());

        app.use(passport.initialize());

        passport.use(new JwtStrategy({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get('jwt.secret')
        }, this.verifyUser.bind(this)));

        app.use(cors());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));

        api.init(app);

        // Define error middleware last
        app.use(function(err, req, res, next) {
            logger.error(err);

            if(!res.headersSent && req.xhr) {
                return res.status(500).send({ success: false });
            }

            next(err);
        });

        return this.server;
    }

    run() {
        let port = process.env.PORT || 4000;

        this.server.listen(port, '0.0.0.0', function onStart(err) {
            if(err) {
                logger.error(err);
            }

            logger.info(`Listening on port ${port}. Open up http://0.0.0.0:${port} in your browser`);
        });
    }

    verifyUser(jwtPayload, done) {
        this.userService.getUserById(jwtPayload._id)
            .then(user => {
                if(user) {
                    return done(null, user);
                }

                return done(null, false);
            })
            .catch(err => {
                return done(err, false);
            });
    }
}

module.exports = Server;
