const Command = require('../../../../../Command');
const CFError = require('cf-errors');
const createGitCmd = require('./../base.cmd');
const { sdk } = require('../../../../../../../logic');

const LINK = 'https://bitbucket.org/account/user/{YOUR-USERNAME}/app-passwords';


const command = new Command({
    command: 'bitbucket <name>',
    parent: createGitCmd,
    description: 'Create a bitbucket context',
    usage: `${createGitCmd.usage}\nTo create bitbucket context you need to generate application password from here: ${LINK}`,
    webDocs: {
        category: 'Create Git Context',
        subCategory: 'bitbucket',
        title: 'bitbucket',
        weight: 10,
    },
    builder: (yargs) => {
        yargs
            .option('app-password', {
                describe: 'Application password generated in bitbucket',
                alias: 'a',
                required: true,
            })
            .option('username', {
                describe: 'username that has permissions to use application password',
                alias: 'u',
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
                type: 'git.bitbucket',
                sharingPolicy: argv.sharingPolicy,
                data: {
                    behindFirewall: argv.behindFirewall,
                    auth: {
                        type: 'basic',
                        username: argv.username,
                        password: argv.appPassword,
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
