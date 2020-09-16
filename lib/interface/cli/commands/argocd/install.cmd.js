/* eslint-disable max-len */
const Command = require('../../Command');
const installRoot = require('../root/install.cmd');
const { downloadArgo } = require('../hybrid/helper');
const { Runner, components } = require('../../../../binary');

const installArgoCmd = new Command({
    root: false,
    parent: installRoot,
    command: 'argocd-agent',
    description: 'Install argo agent',
    webDocs: {
        category: 'Argo',
        title: 'Install',
        weight: 100,
    },
    builder: yargs => yargs
        .env('CF_ARG_') // this means that every process.env.CF_ARG_* will be passed to argv
        .option('token', {
            describe: 'Codefresh user token',
        })
        .option('kube-context-name', {
            describe: 'Name of the kubernetes context on which argocd-agent should be installed [$CF_ARG_KUBE_CONTEXT_NAME]',
        })
        .option('url', {
            describe: 'Codefresh url, by default https://g.codefresh.io',
        })
        .option('kube-namespace', {
            describe: 'Name of the namespace on which argocd-agent should be installed [$CF_ARG_KUBE_NAMESPACE]',
        })
        .option('argo-host', {
            describe: 'Argocd host, example is https://argohost.com',
            required: true,
        })
        .option('argo-username', {
            describe: 'Argocd admin username',
            default: 'admin',
        })
        .option('argo-password', {
            describe: 'Argocd admin password',
            required: true,
        }),
    handler: async (argv) => {
        const {
            url,
            token,
            'kube-context-name': kubeContextName,
            'kube-namespace': kubeNamespace,
            'argo-host': argoHost,
            'argo-password': argoPassword,
            'argo-username': argoUsername,
        } = argv;
        const binLocation = await downloadArgo();
        const componentRunner = new Runner(binLocation);

        const commands = [
            'install',
        ];

        if (token) {
            commands.push('--codefresh-token');
            commands.push(token);
        }

        if (kubeContextName) {
            commands.push('--kube-context-name');
            commands.push(kubeContextName);
        }

        if (kubeNamespace) {
            commands.push('--kube-namespace');
            commands.push(kubeNamespace);
        }

        if (url) {
            commands.push('--codefresh-host');
            commands.push(url);
        }

        if (argoHost) {
            commands.push('--argo-host');
            commands.push(argoHost);
        }

        if (argoPassword) {
            commands.push('--argo-password');
            commands.push(argoPassword);
        }

        if (argoUsername) {
            commands.push('--argo-username');
            commands.push(argoUsername);
        }


        await componentRunner.run(components.argo, commands);
    },
});

module.exports = installArgoCmd;
