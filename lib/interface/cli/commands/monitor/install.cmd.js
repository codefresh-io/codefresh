/* eslint-disable max-len */
const Command = require('../../Command');
const installRoot = require('../root/install.cmd');
const { sdk } = require('../../../../logic');
const ProgressEvents = require('../../helpers/progressEvents');
const cliProgress = require('cli-progress');

const installMonitorCmd = new Command({
    root: false,
    parent: installRoot,
    command: 'monitor',
    description: 'Install and create an cluster resources monitor on kubernetes cluster',
    webDocs: {
        category: 'Monitor',
        title: 'Install',
        weight: 100,
    },
    builder: yargs => yargs
        .env('CF_ARG_') // this means that every process.env.CF_ARG_* will be passed to argv
        .option('cluster-id', {
            describe: 'Cluster id - freestyle name',
        })
        .option('token', {
            describe: 'Codefresh user token',
        })
        .option('kube-context-name', {
            describe: 'Name of the kubernetes context on which monitor should be installed [$CF_ARG_KUBE_CONTEXT_NAME]',
        })
        .option('url', {
            describe: 'Codefresh url, by default https://g.codefresh.io',
        })
        .option('kube-namespace', {
            describe: 'Name of the namespace on which monitor should be installed [$CF_ARG_KUBE_NAMESPACE]',
        })
        .option('verbose', {
            describe: 'Print logs',
        }),
    handler: async (argv) => {
        const {
            'kube-config-path': kubeConfigPath,
            'cluster-id': clusterId,
            token,
            'kube-context-name': kubeContextName,
            'kube-namespace': kubeNamespace,
            verbose,
            noExit,
        } = argv;
        let {
            url,
        } = argv;
        const apiHost = sdk.config.context.url;
        const events = new ProgressEvents();
        const format = 'downloading [{bar}] {percentage}% | {value}/{total}';
        const progressBar = new cliProgress.SingleBar({ stopOnComplete: true, format }, cliProgress.Presets.shades_classic);
        let totalSize;
        events.onStart((size) => {
            console.log('Downloading agent\'s installer \n');
            progressBar.start(size, 0);
            totalSize = size;
        });
        events.onProgress((progress) => {
            progressBar.update(progress);
            if (progress >= totalSize) {
                console.log('\n');
            }
        });
        if (!url) {
            url = apiHost;
        }
        const monitorInstallStatusCode = await sdk.monitor.install({
            apiHost,
            kubeContextName,
            kubeNamespace,
            token,
            clusterId,
            kubeConfigPath,
            verbose,
            events,
            codefreshHost: url,
        });
        if (monitorInstallStatusCode !== 0) {
            throw new Error(`\nCodefresh Monitoring installation failed with code ${monitorInstallStatusCode}`);
        }

        if (!noExit) {
            process.exit(0);
        }
    },
});

module.exports = installMonitorCmd;
