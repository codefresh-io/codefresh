const debug = require('debug')('codefresh:cli:create:context:git:gitlab');
const Command = require('../../../../../Command');
const CFError = require('cf-errors');
const createGitCmd = require('./../base.cmd');
const { sdk } = require('../../../../../../../logic');


const LINK = 'https://gitlab.com/profile/personal_access_tokens';
const DEFAULT_API_URL = 'https://gitlab.com/api/v4/';


const command = new Command({
    command: 'gitlab <name>',
    parent: createGitCmd,
    description: 'Create a gitlab context',
    usage: `${createGitCmd.usage}\nTo create gitlab context you need to generate the token here: ${LINK}`,
    webDocs: {
        category: 'Create Git Context',
        subCategory: 'gitlab',
        title: 'gitlab',
        weight: 10,
    },
    builder: (yargs) => {
        yargs
            .option('access-token', {
                describe: 'Access token from to be used to clone repositories',
                alias: 't',
                required: true,
            })
            .option('api-url', {
                describe: 'URL of the api',
                alias: 'a',
                default: 'https://gitlab.com/api/v4/',
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
                type: 'git.gitlab',
                sharingPolicy: argv.sharingPolicy,
                data: {
                    behindFirewall: argv.behindFirewall,
                    auth: {
                        type: 'basic',
                        password: argv.accessToken,
                    },
                },
            },
        };

        if (argv.apiUrl !== DEFAULT_API_URL) {
            data.spec.data.auth.apiURL = argv.apiUrl;
        }


        if (!data.metadata.name || !data.spec.type) {
            throw new CFError('Name and type must be provided');
        }
        await sdk.contexts.create(data);
        console.log(`Context: ${data.metadata.name} created`);
    },
});

module.exports = command;
