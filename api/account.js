const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const config = require('config');
const UserService = require('../services/UserService');
const { wrapAsync } = require('../utils');

let userService = new UserService();

module.exports.init = function(server) {

    server.post('/account/register', wrapAsync(async (req, res, next) => {
        // data server validation

        let user = await userService.getUserByEmail(req.body.email);
        if(user) {
            res.send({success: false, message: 'Email already exists.'});
            return next();
        }

        user = await userService.getUserByUsername(req.body.username);
        if(user) {
            res.send({success: false, message: 'Username already exists.'});
            return next();
        }

        //bcryp promises seems to be broken, use Sync meanwhile
        //let password = await bcrypt.hash(req.body.password, 8);
        let password = bcrypt.hashSync(req.body.password, 8);

        user = await userService.addUser({
            username: req.body.username,
            email: req.body.email.trim(),
            locale: 'en', // TODO: guess registration locale
            gravatar: crypto.createHash('md5').update(req.body.email.trim().toLowerCase()).digest('hex'),
            disabled: false,
            password: password
        });

        let wiredUser = user.getWireSafeDetails();

        let token = jwt.sign(wiredUser, config.get('jwt.secret'), {expiresIn: '30m'});
        res.send({success: true, user: wiredUser, token: token});
    }));

    server.post('/account/login', wrapAsync(async (req, res, next) => {
        if(!req.body.username) {
            res.send({success: false, message: 'Username must be specified'});
            return next();
        }

        if(!req.body.password) {
            res.send({success: false, message: 'Password must be specified'});
            return next();
        }

        let user = await userService.getUserByUsername(req.body.username);
        if(!user || user.disabled) {
            return res.send({success: false, message: 'Invalid username/password'});
        }

        //bcrypt promises seems to be broken, use Sync meanwhile
        //let isValidPassword = await bcrypt.compare(req.body.password, user.password);
        let isValidPassword = bcrypt.compareSync(req.body.password, user.password);

        if(!isValidPassword) {
            return res.send({success: false, message: 'Invalid username/password'});
        }

        let wiredUser = user.getWireSafeDetails();

        let token = jwt.sign(wiredUser, config.get('jwt.secret'), {expiresIn: '30m'});

        res.send({success: true, user: wiredUser, token: token});
    }));
};
