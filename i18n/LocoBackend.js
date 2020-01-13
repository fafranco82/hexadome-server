const config = require('config');
const async = require('async');
const request = require('request');

const READ_KEY = 'i18n.loco.keys.read';
const WRITE_KEY = 'i18n.loco.keys.write';
const ENDPOINT = 'i18n.loco.endpoint';

const logger = require('../logger');

class LocoBackend {
    constructor() {
        this.type = 'backend';
    }

    init(services, backendOptions, i18nextOptions) {
        this.fallback = i18nextOptions.fallbackLng;
        this.endpoint = config.has(ENDPOINT) ? config.get(ENDPOINT) : 'https://localise.biz:443/api';
        this.readKey = config.has(READ_KEY) ? config.get(READ_KEY) : undefined;
        this.writeKey = config.has(WRITE_KEY) ? config.get(WRITE_KEY) : undefined;
    }

    read(language, namespace, callback) {
        if(this.readKey) {
            let url = `${this.endpoint}/export/locale/${language}.json?filter=${namespace}&fallback=${this.fallback}&key=${this.readKey}`;
            request(url, (error, response, body) => {
                if(error) {
                    logger.error(`Error reading i18n data for language ${language} and namespace ${namespace}: ${error}`);
                    return callback(error);
                }

                try {
                    let json = JSON.parse(body);
                    callback(null, json);
                } catch(e) {
                    logger.error(`Error parsing i18n data for language ${language} and namespace ${namespace}: ${e}`);
                    return callback(e);
                }
            });
        }
    }

    create(languages, namespace, key) { 
        if(this.readKey && this.writeKey && !key.startsWith('[i18n] ')) {
            async.waterfall([
                (done) => {
                    request
                        .get(`${this.endpoint}/assets/${key}.json?key=${this.readKey}`)
                        .on('response', (resp) => {
                            if(resp.statusCode == 401) return done('Wrong key');
                            return done(null, resp.statusCode == 404);
                        })
                        .on('error', (err) => done(err));
                },
                (notFound, done) => {
                    if(notFound) {
                        request
                            .post(`${this.endpoint}/assets?key=${this.writeKey}`)
                            .form({ 'id': key })
                            .on('response', (resp) => {
                                if(resp.statusCode != 201) return done(resp.statusMessage);
                                return done(null, true);
                            })
                            .on('error', (err) => done(err));
                    } else {
                        done(null, false);
                    }
                },
                (created, done) => {
                    if(created) {
                        request
                            .post(`${this.endpoint}/assets/${key}/tags?key=${this.writeKey}`)
                            .form({ 'name': namespace })
                            .on('response', (resp) => {
                                if(resp.statusCode != 200) return done(resp.statusMessage);
                                return done(null, true);
                            })
                            .on('error', (err) => done(err));
                    } else {
                        done(null, false);
                    }
                }
            ], (err, tagged) => {
                if(err) {
                    logger.error(`Error creating asset ${key} for namespace ${namespace}: ${err}`);
                } else if(tagged) {
                    logger.info(`Created asset ${key} for namespace ${namespace}`);
                }
            });
        }
    }
}

LocoBackend.type = 'backend';

module.exports = LocoBackend;
