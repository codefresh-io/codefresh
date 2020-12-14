const Command = require('../../Command');
const CFError = require('cf-errors');
const _ = require('lodash');
const DEFAULTS = require('../../defaults');
const Output = require('../../../../output/Output');
const getRoot = require('../root/get.cmd');
const Promise = require('bluebird');
const { sdk } = require('../../../../logic');
const Workflow = require('../../../../logic/entities/Workflow');

const command = new Command({
    command: 'builds [id..]',
    aliases: ['build'],
    parent: getRoot,
    description: 'Get a specific build or an array of builds',
    usage: 'Passing [id] argument will cause a retrieval of a specific build.\n In case of not passing [id] argument, a list will be returned',
    webDocs: {
        category: 'Builds',
        title: 'Get Build',
    },
    builder: (yargs) => {
        return yargs
            .positional('id', {
                describe: 'Build id',
            })
            .option('limit', {
                alias: 'l',
                describe: 'Limit amount of returned results',
                default: DEFAULTS.GET_LIMIT_RESULTS,
            })
            .option('page', {
                alias: 'p',
                describe: 'Paginated page',
                default: DEFAULTS.GET_PAGINATED_PAGE,
            })
            .option('status', {
                alias: 's',
                describe: 'Filter results by statuses',
                type: Array,
                choices: ['running', 'success', 'error', 'terminated', 'terminating', 'pending-approval', 'delayed', 'pending', 'elected'],
            })
            .option('trigger', {
                alias: 't',
                describe: 'Filter results by triggers',
                type: Array,
                choices: ['build', 'launch-image', 'launch-composition'],
            })
            .option('pipeline-id', {
                alias: 'pid',
                describe: 'Filter results by pipeline id',
                type: Array,
                default: [],
            })
            .option('pipeline-name', {
                alias: 'pipeline',
                describe: 'Filter results by pipeline name',
                type: Array,
                default: [],
            })
            .option('branch', {
                alias: 'b',
                describe: 'Filter results by branch',
                type: Array,
                default: [],
            })
            .option('commit-id', {
                alias: ['revision', 'r', 'sha'],
                describe: 'Filter results by commit revision sha',
                type: Array,
                default: [],
            })
            .option('pipeline-trigger-id', {
                describe: 'Filter results by pipeline trigger id',
                type: Array,
                default: [],
            })
            .option('from', {
                describe: 'Date in format: YYYY-MM-DD. Show builds from the provided date',
                type: String,
            })
            .option('to', {
                describe: 'Date in format: YYYY-MM-DD. Show builds up to provided date',
                type: String,
            })
            .check((argv) => {
                const { from, to } = argv;

                const dateRegex = /^\d{4}-\d{1,2}-\d{1,2}$/;
                if (from && !dateRegex.test(from)) {
                    throw new Error('--from option should take a date in format: YYYY-MM-DD. Example: --from 2020-12-31');
                }
                if (to && !dateRegex.test(to)) {
                    throw new Error('--to option should take a date in format: YYYY-MM-DD. Example: --to 2020-12-31');
                }
                return true;
            })
            .example('codefresh get build ID', 'Get build ID')
            .example('codefresh get builds', 'Get all builds')
            .example('codefresh get builds --pipeline-id ID', 'Get all builds that are executions of pipeline "ID"')
            .example('codefresh get builds --pipeline-name NAME', 'Get all builds that are executions of pipelines that are named "NAME"')
            .example('codefresh get builds --status=error', 'Get all builds that their status is error')
            .example('codefresh get builds --from=2020-01-01 --to=2020-02-01', 'Get all builds within given date range');
    },
    handler: async (argv) => {
        const workflowIds = argv.id;
        const {
            limit,
            page,
            status,
            trigger,
            branch: branchName,
            commitId: revision,
            'pipeline-trigger-id': pipelineTriggerId,
            from,
            to,
        } = argv;
        const pipelineNames = !_.isArray(argv['pipeline-name']) ? [(argv['pipeline-name'])] : argv['pipeline-name'];
        const pipelineIds = !_.isArray(argv['pipeline-id']) ? [(argv['pipeline-id'])] : argv['pipeline-id'];

        const requestOptions = {
            limit,
            page,
            status,
            trigger,
            branchName,
            revision,
            pipelineTriggerId,
            startDate: from,
            endDate: to,
        };

        let workflows = [];
        // TODO:need to decide for one way for error handeling
        if (!_.isEmpty(workflowIds)) {
            workflows = await Promise.map(workflowIds, id => sdk.workflows.getBuild({ buildId: id, noAccount: false }));
            Output.print(_.map(workflows, Workflow.fromResponse));
        } else {
            if (!_.isEmpty(pipelineNames)) {
                const pipelines = await sdk.pipelines.list({
                    id: pipelineNames,
                });
                if (!_.isEmpty(pipelines)) {
                    _.forEach(pipelines.docs, (currPipeline) => {
                        pipelineIds.push(currPipeline.metadata.id);
                    });
                    requestOptions.pipeline = pipelineIds;
                } else if (_.isEmpty(pipelineIds)) {
                    throw new CFError('Cannot find any builds with these pipelines names');
                }
            } else if (!_.isEmpty(pipelineIds)) {
                requestOptions.pipeline = pipelineIds;
            }

            const result = await sdk.workflows.list(requestOptions);
            Output.print(_.map(_.get(result, 'workflows.docs'), Workflow.fromResponse));
        }
    },
});

module.exports = command;
