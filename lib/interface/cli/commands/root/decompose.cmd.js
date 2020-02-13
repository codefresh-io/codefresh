const CFError = require('cf-errors');
const yargs = require('yargs');
const _ = require('lodash');
const Command = require('../../Command');


const decompose = new Command({
    root: true,
    command: 'decompose',
    usage: 'Supported resources:',
    description: 'Decompose Codefresh resource into parts',
    webDocs: {
        description: 'De  Codefresh resource into parts',
        category: 'Decompose',
        title: 'Decompose',
        weight: 10,
    },
    builder: _.identity,
    handler: async (argv) => {
        if (!argv.filename) {
            yargs.showHelp();
            return;
        }
        const data = argv.filename;
        const entity = data.kind;

        switch (entity) {
            default:
                throw new CFError(`Entity: ${entity} not supported`);
        }
    },
});

module.exports = decompose;
