/* eslint-disable max-len */
const Command = require('../../Command');
const installRoot = require('../root/install.cmd');
const { sdk } = require('../../../../logic');
const installRuntimeCmd = require('../runtimeEnvironments/install.cmd');
const { getKubeContext } = require('../../helpers/kubernetes');

const installAgentCmd = new Command({
    root: false,
    parent: installRoot,
    command: 'agent',
    description: 'Install and create an agent on kubernetes cluster',
    webDocs: {
        category: 'Agents',
        title: 'Install',
        weight: 100,
    },
    builder: yargs => yargs
        .env('CF_ARG_') // this means that every process.env.CF_ARG_* will be passed to argv
        .option('name', {
            describe: 'Agent\'s name to be created if token is not provided',
        })
        .option('token', {
            describe: 'Agent\'s token',
        })
        .option('kube-context-name', {
            describe: 'Name of the kubernetes context on which venona should be installed [$CF_ARG_KUBE_CONTEXT_NAME]',
        })
        .option('kube-node-selector', {
            describe: 'The kubernetes node selector "key=value" to be used by venona build resources (default is no node selector) (string)',
        })
        .option('dry-run', {
            describe: 'Set to true to simulate installation',
        })
        .option('in-cluster', {
            describe: 'Set flag if venona is been installed from inside a cluster',
        })
        .option('kube-namespace', {
            describe: 'Name of the namespace on which venona should be installed [$CF_ARG_KUBE_NAMESPACE]',
        })
        .option('kubernetes-runner-type', {
            describe: 'Set the runner type to kubernetes (alpha feature)',
        })
        .option('tolerations', {
            describe: 'The kubernetes tolerations as path to a  JSON file to be used by venona resources (default is no tolerations) (string)',
        })
        .option('venona-version', {
            describe: 'Version of venona to install (default is the latest)',
        })
        .option('kube-config-path', {
            describe: 'Path to kubeconfig file (default is $HOME/.kube/config)',
        })
        .option('skip-version-check', {
            describe: 'Do not compare current Venona\'s version with latest',
        })
        .option('install-runtime', {
            describe: 'Install and attach runtime on the same namespace as the agent (default is false)',
        })
        .option('verbose', {
            describe: 'Print logs',
        }),
    handler: async (argv) => {
        let {
            name, token,
        } = argv;
        const {
            'kube-node-selector': kubeNodeSelector,
            'dry-run': dryRun,
            'in-cluster': inCluster,
            'kube-namespace': kubeNamespace,
            'kubernetes-runner-type': kubernetesRunnerType,
            tolerations,
            'venona-version': venonaVersion,
            'kube-config-path': kubeConfigPath,
            'skip-version-check': skipVersionCheck,
            'install-runtime': installRuntime,
            verbose,
        } = argv;
        let agent;
        let { 'kube-context-name': kubeContextName } = argv;
        if (!kubeContextName) {
            kubeContextName = getKubeContext(kubeConfigPath);
        }

        if (!token) { // Create an agent if not provided
            name = name || `${kubeContextName}_${kubeNamespace}`;
            agent = await sdk.agents.create({ name });
            // eslint-disable-next-line prefer-destructuring
            token = agent.token;
            console.log(`An agent with name: ${name} was created\n note this the last only time the token will be printed`);
            console.log(token);
        } else {
            // take the agent id from the token
            const apiKey = token.split('.')[0];
            const agentData = await sdk.tokens.getById({ id: apiKey });
            if (!agentData) {
                throw new Error('token is not valid');
            }
            const { subject } = agentData;

            if (subject.type !== 'agent') {
                throw new Error('token is not assosicated with agent');
            }
            const agentId = agentData.subject.ref;
            const data = await sdk.agents.get({ agentId });
            // eslint-disable-next-line prefer-destructuring
            name = data.name;
        }
        const apiHost = sdk.config.context.url;
        const agentInstallStatusCode = await sdk.agents.install({
            apiHost,
            kubeContextName,
            kubeNamespace,
            token,
            dryRun,
            inCluster,
            kubeNodeSelector,
            kubernetesRunnerType,
            tolerations,
            venonaVersion,
            kubeConfigPath,
            skipVersionCheck,
            verbose,
            agentId: name,
            terminateProcess: false,
        });
        await sdk.agent.reportEvent(
            { agentId: agent.id },
            {
                name: 'Agent.installed',
                data: { code: agentInstallStatusCode, context: kubeContextName, namespace: kubeNamespace },
            },
        );
        if (agentInstallStatusCode !== 0) {
            throw new Error(`\nAgent installation failed with code ${agentInstallStatusCode}`);
        }
        if (installRuntime) {
            await installRuntimeCmd.handler({
                'runtime-kube-context-name': kubeContextName,
                'runtime-kube-namespace': kubeNamespace,
                'agent-name': name,
                'runtime-kube-config-path': kubeConfigPath,
                'attach-runtime': true,
                'restart-agent': true,
                verbose,
            });
        } else {
            process.exit(0);
        }
    },
});

module.exports = installAgentCmd;
