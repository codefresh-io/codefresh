const debug = require('debug')('codefresh:cli:create:context:git:stash');
const Command = require('../../../../../Command');
const CFError = require('cf-errors');
const createGitCmd = require('./../base.cmd');
const { sdk } = require('../../../../../../../logic');


const command = new Command({
    command: 'stash <name>',
    parent: createGitCmd,
    description: 'Create a stash context',
    usage: `${createGitCmd.usage}\nTo create Stash context you need to provider username and password`,
    webDocs: {
        category: 'Create Git Context',
        subCategory: 'stash',
        title: 'stash',
        weight: 10,
    },
    builder: (yargs) => {
        yargs
            .option('username', {
                describe: 'Username',
                alias: 'u',
                required: true,
            })
            .option('password', {
                describe: 'Password',
                alias: 'p',
                required: true,
            })
            .option('api-url', {
                describe: 'URL of the api',
                alias: 'a',
                required: true,
            });
        return yargs;
    },
    handler: async (argv) => {
        const data = {
            apiVersion: 'v1',
            kind: 'context',
            metadata: {
                name: argv.name,
            },
            spec: {
                type: 'git.stash',
                sharingPolicy: argv.sharingPolicy,
                data: {
                    auth: {
                        type: 'basic',
                        username: argv.username,
                        password: argv.password,
                        apiURL: argv.apiUrl,
                    },
                },
            },
        };


        if (!data.metadata.name || !data.spec.type) {
            throw new CFError('Name and type must be provided');
        }

        await sdk.contexts.create(data);
        console.log(`Context: ${data.metadata.name} created`);
    },
});

module.exports = command;
