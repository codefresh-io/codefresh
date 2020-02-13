/* eslint-disable array-callback-return */
const _ = require('lodash');
const path = require('path');
const { homedir } = require('os');
const Command = require('../../Command');
const root = require('../root/decompose.cmd');
const {
    downloader, catalog, runner, specloader,
} = require('../../components');

const component = catalog['step-generator'];
const CODEFRESH_PATH = path.resolve(homedir(), '.Codefresh');

const command = new Command({
    command: 'step-types',
    betaCommand: true,
    aliases: ['step-type'],
    parent: root,
    description: 'Decompose Codefresh step-type into parts',
    webDocs: {
        category: 'Step-types',
        title: 'Decompose Step-type',
    },
    builder: (yargs) => {
        const cliYaml = specloader.load(CODEFRESH_PATH, component);
        _.chain(cliYaml)
            .get('commands', [])
            .find({ name: 'decompose' })
            .get('flags', {})
            .map((v) => {
                const opt = { describe: v.description };
                if (v.type === 'bool') {
                    opt.bool = true;
                }
                if (v.type === 'string') {
                    opt.string = true;
                }
                yargs.option(v.name, opt);
            })
            .value();
        return yargs;
    },
    handler: async (args) => {
        const cliYaml = specloader.load(CODEFRESH_PATH, component);
        const options = [
            'decompose',
        ];
        const flags = _.chain(cliYaml)
            .get('commands', [])
            .find({ name: 'decompose' })
            .get('flags', {})
            .value();
        _.map(args, (v, k) => {
            if (_.find(flags, { name: k })) {
                options.push(`--${k}`);
                options.push(v);
            }
        });
        try {
            await downloader.download(CODEFRESH_PATH, component);
            await runner.run(process, path.join(CODEFRESH_PATH, component.id, component.id), options);
            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    },
});
module.exports = command;

