const Command = require('../../../Command');
const { followLogs } = require('../../../helpers/workflow');
const { sdk } = require('../../../../../logic');
const { normalizeValues, normalizeSetValues } = require('../../../helpers/helm');
const Output = require('../../../../../output/Output');
const _ = require('lodash');
const CFError = require('cf-errors');

const RELEASE_NAME = 'agent';
const CHART_NAME = 'cfk8sagent';
const HELM_REPOSITORY = 'http://chartmuseum.codefresh.io';
const API_PATH = '/k8s-monitor/events';

const install = new Command({
    root: true,
    command: 'install-agent',
    description: 'Install cluster agent',
    webDocs: {
        category: 'Predefined Pipelines',
        title: 'Install Cluster Agent',
        weight: 20,
    },
    builder: (yargs) => {
        return yargs
            .option('release-name', {
                description: 'The name to set to the release',
                default: RELEASE_NAME,
            })
            .option('api-key', {
                description: 'Codefresh api key',
                alias: 'k',
            })
            .option('api-url', {
                description: 'Url of the codefresh api (default: current cli context url)',
                alias: 'u',
            })
            .option('cluster', {
                description: 'Install on cluster',
                type: 'string',
                required: true,
                alias: 'c',
            })
            .option('namespace', {
                description: 'Install on namespace',
                default: 'default',
                type: 'string',
                alias: 'ns',
            })
            .option('tiller-namespace', {
                description: 'Where tiller has been installed',
                default: 'kube-system',
                type: 'string',
                alias: 'tn',
            })
            .option('context', {
                description: 'Contexts (yaml || secret-yaml) to be passed to the install',
                array: true,
            })
            .option('set', {
                description: 'set of KEY=VALUE to be passed to the install',
                array: true,
                default: [],
            })
            .option('detach', {
                alias: 'd',
                describe: 'Run pipeline and print build ID',
            })
            .example('codefresh install-agent', 'Install agent chart from http://chartmuseum.codefresh.io')
            .example('codefresh install-agent --name mongodb  --repository my-help-repository', 'Install chart saved repo');
    },
    handler: async (argv) => {
        try {
            const { context: authContext } = sdk.config;
            const urlVar = `apiUrl=${argv.apiUrl || authContext.url}${API_PATH}`;
            const tokenVar = `apiToken=${argv.apiKey || authContext.token}`;

            const variables = argv.set.concat([urlVar, tokenVar]);

            const helmRepoName = _.chain(await sdk.contexts.list({ type: 'helm-repository' }))
                .map(c => ({
                    name: _.get(c, 'metadata.name'),
                    url: _.get(c, 'spec.data.repositoryUrl'),
                }))
                .filter(c => c.url === HELM_REPOSITORY)
                .first()
                .get('name')
                .value();

            if (!helmRepoName) {
                throw new CFError(`No helm-repository context exists for url: '${HELM_REPOSITORY}'. Please add a context for it`);
            }

            const latestChartVersion = _.chain(await sdk.charts.list({ repo: helmRepoName }))
                .filter(c => c.name === CHART_NAME)
                .first()
                .get('version')
                .value();

            if (!latestChartVersion) {
                throw new CFError(`No charts were found for name '${CHART_NAME}' at ${HELM_REPOSITORY}`);
            }

            const result = await sdk.helm.charts.install({
                selector: argv.cluster,
                tillerNamespace: argv.tillerNamespace,
            }, {
                namespace: argv.namespace,
                releaseName: argv.releaseName,
                name: CHART_NAME,
                repository: helmRepoName,
                version: latestChartVersion,
                values: await normalizeValues(argv.context),
                set: await normalizeSetValues(variables),
            });
            const workflowId = result.id;

            if (argv.detach) {
                console.log(workflowId);
                return;
            }
            await followLogs(workflowId);
        } catch (err) {
            Output.printError(err);
            process.exit(1);
        }
    },
});

module.exports = install;
