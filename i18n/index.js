const config = require('config');
const languages = config.get('i18n.languages');

const i18next = require('i18next');
//const Backend = require('i18next-sync-fs-backend');
const LocoBackend = require('./LocoBackend');
const ICU = require('i18next-icu');

const i18n = i18next.createInstance();
//i18n.use(Backend);
i18n.use(ICU);
i18n.use(LocoBackend);

i18n.init({
    fallbackLng: languages[0],
    ns: ['messages', 'listing'],
    defaultNS: 'messages',
    debug: false,
    initImmediate: false,
    saveMissing: true,
    saveMissingTo: "current",
});
i18n.loadLanguages(languages);
i18n.changeLanguage(languages[0]);
module.exports = i18n;
