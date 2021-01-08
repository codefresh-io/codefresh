const debug = require('debug')('codefresh:cli:create:context:secret-store:kubernetes');
const Command = require('../../../../../Command');
const CFError = require('cf-errors');
const cmd = require('../base.cmd');
const { sdk } = require('../../../../../../../logic');

const command = new Command({
    command: 'kubernetes <name>',
    parent: cmd,
    description: 'Create a secret-store Kubernetes context',
    usage: cmd.usage,
    webDocs: {
        category: 'Create Secret-Store Context',
        subCategory: 'kubernetes',
        title: 'kubernetes',
        weight: 10,
    },
    builder: (yargs) => {
        yargs
            .option('cluster', {
                describe: 'Name of the Kubernetes clsuter as it saved in Codefresh',
                required: true,
            })
            .option('namespace', {
                describe: 'Name of the Kubernetes namespace',
                required: true,
                default: 'default',
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
        const data = {
            apiVersion: 'v1',
            kind: 'context',
            metadata: {
                name: argv.name,
            },
            spec: {
                type: 'secret-store.kubernetes',
                sharingPolicy: argv.sharingPolicy,
                data: {
                    resourceType: argv.resourceType,
                    resourceName: argv.resourceName,
                    cluster: argv.cluster,
                    namespace: argv.namespace,
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
