const _ = require('lodash');
const i18n = require('../i18n');

const MessageFormatter = require('./helpers/MessageFormatter');

class GameChat {
    constructor() {
        this.messages = [];
    }

    addMessage(message, args, type) {
        this.messages.push({
            date: new Date(),
            type: this.formatType(type),
            message: message,
            args: MessageFormatter.formatArgs(args || {})
        });
    }

    formatType(type) {
        if(type === undefined) {
            return {main: 'default'};
        } else if(_.isObject(type)) {
            return type;
        } else {
            return {main: type};
        }
    }

    getMessages(locale='en') {
        const t = i18n.getFixedT(locale);
        return _.map(this.messages, data => {
            return _.mapValues(data, (v, k) => {
                if(k==='message' && data.type.main !== 'chat') {
                    return MessageFormatter.getFragments(v, data.args, t);
                }

                return v;
            });
        });
    }
}

module.exports = GameChat;
