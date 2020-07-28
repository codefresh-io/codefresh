const Command = require('../../Command');
const { sdk } = require('../../../../logic');
const CFError = require('cf-errors');

const createRoot = require('../root/create.cmd');

const command = new Command({
    command: 'pipeline [name]',
    aliases: ['pip', 'pipeline'],
    parent: createRoot,
    description: 'Create a pipeline',
    webDocs: {
        category: 'Pipelines',
        title: 'Create Pipeline',
    },
    builder: yargs => yargs
        .positional('name', {
            describe: 'New pipeline name',
        })
        .option('project', {
            describe: 'New pipeline project',
        })
        .option('template', {
            describe: 'template identifier to create the pipeline from',
            required: true,
        })
        .example('codefresh create pipeline pip1 --project proj1 --template temp1', 'Create pipeline base on temp1 template'),
    handler: async (argv) => {
        const { template, project, name } = argv;
        const fullName = project ? `${project}/${name}` : name;
        try {
            await sdk.pipelines.createPipelineFromTemplate({ name: template }, {
                name: fullName,
                project,
            });
        } catch (error) {
            if (error.statusCode === 400) {
                throw new CFError({
                    message: `Pipeline ${template} is not a template`,
                });
            }
            if (error.statusCode === 404) {
                throw new CFError({
                    message: `Pipeline ${template} was not found`,
                });
            }
            throw error;
        }
        console.log(`Pipeline was ${fullName} created`);
    },
});

module.exports = command;
