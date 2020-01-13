const _ = require('lodash');
const fs = require('fs');
const path = require('path');

function getDirectories(srcpath) {
    let fullPath = path.join(__dirname, srcpath);
    return fs.readdirSync(fullPath).filter(function(file) {
        return fs.statSync(path.join(fullPath, file)).isDirectory();
    });
}

function loadFiles(directory) {
    let characters = {};
    let fullPath = path.join(__dirname, directory);
    let files = fs.readdirSync(fullPath).filter(function(file) {
        return !fs.statSync(path.join(fullPath, file)).isDirectory();
    });

    for(let file of files) {
        let character = require('./' + directory + '/' + file);

        characters[character.id] = character;
    }

    return characters;
}

function loadCharacters(directory) {
    let characters = loadFiles(directory);

    _.each(getDirectories(directory), dir => {
        characters = Object.assign(characters, loadCharacters(path.join(directory, dir)));
    });

    return characters;
}

let characters = {};
let directories = getDirectories('.');

for(let directory of directories) {
    characters = Object.assign(characters, loadCharacters(directory));
}

module.exports = characters;