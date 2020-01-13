const _ = require('lodash');

const UserContextFields = ['gender'];

class MessageFormatter {

    formatArgs(args) {
        if(!args.context) {
            args.context = {};
        }

        _.each(args, (arg, argName) => {
            if(arg.user) {
                _.each(UserContextFields, field => args.context[`${argName}_${field}`] = arg.user[field]);
            }
        });

        return _.mapValues(args, (v, k) => this.formatArgument(v, k));
    }

    formatArgument(arg, argName) {
        if(argName === 'context') {
            return arg;
        } else if(Array.isArray(arg)) {
            return _.map(arg, this.formatArgument);
        } else if(arg.formatAsMessageArg && _.isFunction(arg.formatAsMessageArg)) {
            return arg.formatAsMessageArg();
        } else if(arg.name && arg.gravatar) {
            return {arg: 'player', name: arg.name, gravatar: arg.gravatar};
        } else if(arg.username && arg.gravatar) {
            return {arg: 'user', name: arg.username, gravatar: arg.gravatar};
        } else if(_.isObject(arg) && !arg.arg) {
            console.log(arg);
            return 'unknown';
        } else {
            return arg;
        }
    }

    getFragments(message, args, t) {
        message = _.startsWith(message, "@") ? message.substring(1) : t(message, (args && args.context) || {});

        let returnedFragments = [];

        _.each(message.split(/(\[\[\w+\]\])/), fragment => {
            let match = fragment.match(/\[\[(\w+)\]\]/);
            if(match && _.has(args, match[1])) {
                let arg = args[match[1]];
                if(Array.isArray(arg) && arg.length > 0) {
                    returnedFragments.push(...this.getArrayFragments(t, arg));
                } else {
                    returnedFragments.push(arg);
                }
            } else {
                returnedFragments.push(fragment);
            }
        });
        return returnedFragments;
    }

    getArrayFragments(t, args) {
        let template = '';
        for(let i=0;i < args.length;i++) {
            if(i==0) {
                template = template + t('listing:first');
            } else if(i < args.length - 1) {
                template = template + t('listing:middle');
            } else {
                template = template + t('listing:last');
            }
        }

        let returnedFragments = [];
        let elemIndex = 0;
        _.each(template.split(/(\[\[elem\]\])/), fragment => {
            let match = fragment.match(/\[\[elem\]\]/);
            if(match && args[elemIndex]) {
                returnedFragments.push(args[elemIndex]);
                elemIndex++;
            } else {
                returnedFragments.push(fragment);
            }
        });

        return returnedFragments;
    }
}

module.exports = new MessageFormatter();
