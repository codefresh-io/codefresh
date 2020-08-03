const url = require('url');
const CFError = require('cf-errors');

class ArgoLogic {
    static resolveHost(hostUrl) {
        const { host, protocol } = url.parse(hostUrl);
        if (!host) {
            throw new CFError('Incorrect host url');
        }
        return [(protocol || 'https:'), host].join('//');
    }
}


module.exports = ArgoLogic;
