const Command = require('../../Command');
const createRoot = require('../root/create.cmd');
const sdk = require('../../../../logic/sdk');
const ArgoLogic = require('./argo.logic');

const command = new Command({
    parent: createRoot,
    command: 'argo <name>',
    description: 'Add argo integration',
    webDocs: {
        category: 'ArgoCD',
        title: 'create',
    },
    builder: yargs => yargs
        .positional('name', {
            describe: 'Integration name',
            required: true,
        })
        .option('host', {
            describe: 'Host of ArgoCD',
            required: true,
        })
        .option('username', {
            describe: 'Username to ArgoCD',
            required: true,
        })
        .option('password', {
            describe: 'Password to ArgoCD',
            required: true,
        })
        // eslint-disable-next-line max-len
        .example('codefresh create argo demo-integration --host https://example.com --username admin --password password', 'Create integration'),
    handler: async (argv) => {
        const {
            name, host, username, password,
        } = argv;
        await sdk['environments-v2']['add-provider']({
            type: 'argo-cd',
            data: {
                name,
                url: ArgoLogic.resolveHost(host),
                username,
                password,
            },
        });

        console.log('Integration was created');
    },
});

module.exports = command;
