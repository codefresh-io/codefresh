const debug = require('debug')('codefresh:cli:create:context:secret-store:kubernetes');
const Command = require('../../../../../Command');
const CFError = require('cf-errors');
const cmd = require('../base.cmd');
const { sdk } = require('../../../../../../../logic');

const command = new Command({
    command: 'kubernetes-runtime <name>',
    parent: cmd,
    description: 'Create a secret-store Kubernetes-Runtime context',
    usage: 'Create a secret store to use hybrid runtime to access K8S secret/configmap and use it as secret store',
    webDocs: {
        category: 'Create Secret-Store Context',
        subCategory: 'kubernetes-Runtime',
        title: 'kubernetes-runtime',
        weight: 10,
    },
    builder: (yargs) => {
        yargs
            .option('runtimes', {
                describe: 'Names of the runtime-environment to be used as secret store',
                type: 'array',
                alias: 'runtime',
                default: ['*'],
            })
            .option('resource-type', {
                describe: 'Type of the resource in Kubernetes',
                required: true,
                choices: ['secret', 'configmap'],
            })
            .option('resource-name', {
                describe: 'Name of the resource in Kubernetes',
            });
        return yargs;
    },
    handler: async (argv) => {
        let runtimes = [];
        if (argv.runtime) {
            runtimes = argv.runtimes;
        }
        const data = {
            apiVersion: 'v1',
            kind: 'context',
            metadata: {
                name: argv.name,
            },
            spec: {
                type: 'secret-store.kubernetes-runtime',
                sharingPolicy: argv.sharingPolicy,
                data: {
                    resourceType: argv.resourceType,
                    resourceName: argv.resourceName,
                    runtimes,
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
