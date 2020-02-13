const fs = require('fs');
const _ = require('lodash');
const YAML = require('js-yaml');
const rp = require('request-promise');
const request = require('request');
const { homedir, arch } = require('os');
const decompress = require('decompress');
const decompressTargz = require('decompress-targz');
const compareVersions = require('compare-versions');
const path = require('path');
const Promise = require('bluebird');

async function download(dirname, component) {
    const deferred = Promise.defer();
    const componentDirname = path.join(dirname, component.id);
    const versionPath = path.join(componentDirname, 'cli.yaml');
    const versionUrl = `https://raw.githubusercontent.com/${component.repo}/${component.branch}/${component.file}`;
    let zipPath = path.join(componentDirname, 'data');
    let shouldUpdate = true;
    const options = {
        url: versionUrl,
        method: 'GET',
        headers: { 'User-Agent': 'codefresh' },
    };
    const result = await rp(options);
    const cliYaml = YAML.load(result);
    const version = _.get(cliYaml, 'metadata.version');
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname);
        fs.mkdirSync(componentDirname);
    } else if (!fs.existsSync(componentDirname)) {
        fs.mkdirSync(componentDirname);
    } else if (fs.existsSync(versionPath)) {
        const cliYamlString = fs.readFileSync(versionPath, 'utf8');
        const cachedCliYaml = YAML.load(cliYamlString);
        const currVersion = cachedCliYaml.metadata.version;
        if (compareVersions(currVersion, version) >= 0) {
            shouldUpdate = false;
        }
    }
    if (shouldUpdate) {
        let osType;
        const { platform } = process;
        const rand = Math.random().toString();
        if (_.isEqual(platform, 'darwin')) {
            osType = _.isEqual(arch(), 'x32') ? 'Darwin_i386.tar.gz' : 'Darwin_x86_64.tar.gz';
            zipPath = `${zipPath}-${rand}.tar.gz`;
        } else if (_.isEqual(platform, 'linux')) {
            osType = _.isEqual(arch(), 'x32') ? 'Linux_i386.tar.gz' : 'Linux_x86_64.tar.gz';
            zipPath = `${zipPath}-${rand}.tar.gz`;
        } else if (_.isEqual(platform, 'ein32')) {
            osType = _.isEqual(arch(), 'x32') ? 'Windows_i386.zip' : 'Windows_x86_64.zip';
            zipPath = `${zipPath}-${rand}.zip`;
        }
        const assetUrl = `https://github.com/${component.repo}/releases/download/${version}/${component.id}_${version}_${osType}`;
        const req = request(assetUrl);
        req.pipe(fs.createWriteStream(zipPath));
        req.on('end', () => {
            const outputPath = path.join(homedir(), '.Codefresh', component.id);
            decompress(zipPath, outputPath, {
                plugins: [
                    decompressTargz(),
                ],
            })
                .then(() => {
                    fs.unlinkSync(zipPath);
                    try {
                        fs.writeFileSync(versionPath, result, 'utf8');
                        deferred.resolve();
                    } catch (err) {
                        deferred.reject(err);
                    }
                });
        });
    } else {
        deferred.resolve();
    }

    return deferred.promise;
}

module.exports = {
    download,
};
