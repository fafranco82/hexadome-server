function wrapAsync(fn) {
    return function(req, res, next) {
        fn(req, res, next).catch(next);
    };
}

function escapeRegex(regex) {
    return regex.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
}

module.exports = {
    wrapAsync: wrapAsync,
    escapeRegex: escapeRegex
};
