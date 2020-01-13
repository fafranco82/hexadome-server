const commandLineArgs = require('command-line-args');
const path = require('path');

const DataImport = require('./fetchdata/DataImport');

const JsonDataSource = require('./fetchdata/JsonDataSource');

const NoImageSource = require('./fetchdata/NoImageSource');

const optionsDefinition = [
    { name: 'data-source', type: String, defaultValue: 'json' },
    { name: 'data-dir', type: String, defaultValue: path.join(__dirname, '..', '..', 'data') },
    { name: 'image-source', type: String, defaultValue: 'none' },
    { name: 'image-dir', type: String, defaultValue: path.join(__dirname, '..', '..', '..', 'web', 'public', 'images', 'cards') },
    { name: 'no-images', type: Boolean, defaultValue: false },
    { name: 'language', type: String, defaultValue: 'en' }
];

function createDataSource(options) {
    switch(options['data-source']) {
        case 'json':
            return new JsonDataSource(options['data-dir']);
    }

    throw new Error(`Unknown data source '${options['data-source']}'`);
}

function createImageSource(options) {
    if(options['no-images']) {
        return new NoImageSource();
    }

    switch(options['image-source']) {
        case 'none':
            return new NoImageSource();
        //case 'cardgamedb':
            //return new CardgamedbImageSource();
    }

    throw new Error(`Unknown image source '${options['image-source']}'`);
}

let options = commandLineArgs(optionsDefinition);

let dataSource = createDataSource(options);
let imageSource = createImageSource(options);

let dataImport = new DataImport(dataSource, imageSource, options['image-dir'], options['language']);

dataImport.import();