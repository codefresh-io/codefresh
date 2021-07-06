const Command = require('../../Command');
const CFError = require('cf-errors');
const moment = require('moment');
const _ = require('lodash');
const DEFAULTS = require('../../defaults');
const Output = require('../../../../output/Output');
const getRoot = require('../root/get.cmd');
const { sdk } = require('../../../../logic');
const Workflow = require('../../../../logic/entities/Workflow');

const command = new Command({
    command: 'builds-v2 [direction]',
    parent: getRoot,
    description: 'Get an array of the builds',
    usage: 'Return the list of the builds according to specified filters. You can use \'prev\' of \'next\' commands to paginate forth and back',
    webDocs: {
        category: 'Builds',
        title: 'Get Build',
    },
    builder: (yargs) => {
        return yargs
            .positional('direction', {
                describe: 'Pagination actions',
                choices: ['prev', 'next', 'refresh'],
            })
            .option('limit', {
                alias: 'l',
                describe: 'Limit amount of returned results',
                default: DEFAULTS.GET_LIMIT_RESULTS,
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
                describe: 'ISO string date. Show builds from the provided date',
                type: String,
            })
            .option('to', {
                describe: 'ISO string date. Show builds up to provided date',
                type: String,
            })
            .example('codefresh get builds-v2', 'Get first page of all builds')
            .example('codefresh get builds-v2 refresh', 'Refresh current pagination session page')
            .example('codefresh get builds-v2 next', 'Get next builds page')
            .example('codefresh get builds-v2 prev', 'Get previous builds page')
            .example('codefresh get builds-v2 --pipeline-id ID', 'Get all builds that are executions of pipeline "ID"')
            .example('codefresh get builds-v2 --status=error', 'Get all builds that their status is error')
            .example('codefresh get builds-v2 --from=2020-01-01 --to=2020-02-01', 'Get all builds within given date range');
    },
    handler: async (argv) => {
        const {
            limit,
            page,
            status,
            trigger,
            branch: branchName,
            commitId: revision,
            'pipeline-trigger-id': pipelineTriggerId,
            direction,
            from,
            to,
        } = argv;
        const pipelineNames = !_.isArray(argv['pipeline-name']) ? [(argv['pipeline-name'])] : argv['pipeline-name'];
        const pipelineIds = !_.isArray(argv['pipeline-id']) ? [(argv['pipeline-id'])] : argv['pipeline-id'];
        const formattedFromDate = from && moment(from).isValid && moment(from).format('YYYY-MM-DD');
        const formattedToDate = to && moment(to).isValid && moment(to).format('YYYY-MM-DD');

        //  TODO: ensure params are present in open api
        const requestOptions = {
            limit,
            page,
            status,
            trigger,
            branchName,
            revision,
            pipelineTriggerId,
            startDate: formattedFromDate,
            endDate: formattedToDate,
            paginationDirection: direction,
            paginationReset: !direction,
        };

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
    },
});

module.exports = command;
