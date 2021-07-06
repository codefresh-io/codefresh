let installCmd = require('./install-chart.cmd');
let promoteCmd = require('./promote-chart.cmd');

installCmd.requiresAuthentication = false;
promoteCmd.requiresAuthentication = false;

installCmd = installCmd.toCommand();
promoteCmd = promoteCmd.toCommand();

jest.mock('../../../helpers/helm');
jest.mock('../../../helpers/logs');
jest.spyOn(process, 'exit').mockImplementation();

const request = require('requestretry');

const DEFAULT_RESPONSE = request.__defaultResponse();

describe('helm-chart commands', () => {
    beforeEach(async () => {
        request.__reset();
        request.mockClear();
        await configureSdk(); // eslint-disable-line
    });

    describe('install-chart', () => {
        it('should handle installing', async () => {
            const argv = {
                cluster: 'selector',
                tillerNamespace: 'tillerNamespace',
                namespace: 'namespace',
                releaseName: 'releaseName',
                name: 'name',
                repository: 'repository',
                version: 'version',
                context: ['context'],
                set: ['set'],
            };
            await installCmd.handler(argv);
            await verifyResponsesReturned([DEFAULT_RESPONSE]); // eslint-disable-line
        });
    });

    describe('install-agent', () => {
        it('should handle installing', async () => {
            const argv = {
                cluster: 'selector',
                tillerNamespace: 'tillerNamespace',
                namespace: 'namespace',
                version: 'version',
                context: ['context'],
                set: ['set'],
            };
            await installCmd.handler(argv);
            await verifyResponsesReturned([DEFAULT_RESPONSE]); // eslint-disable-line
        });
    });

    describe('promote-chart', () => {
        it('should handle promotion', async () => {
            const argv = {
                selector: 'selector',
                sourceTillerNamespace: 'sourceTillerNamespace',
                board: 'board',
                source: 'source',
                target: 'target',
                sourceRelease: 'sourceRelease',
                sourceNamespace: 'sourceNamespace',
                revision: 'revision',
                targetCluster: 'targetCluster',
                targetTillerNamespace: 'targetTillerNamespace',
                namespace: 'namespace',
                targetRelease: 'targetRelease',
                context: ['context'],
                set: ['set'],
            };
            await promoteCmd.handler(argv);
            await verifyResponsesReturned([DEFAULT_RESPONSE]); // eslint-disable-line
        });
    });
});
