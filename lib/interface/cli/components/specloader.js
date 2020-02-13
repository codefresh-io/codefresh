const { readFileSync } = require('fs');
const { join } = require('path');
const { safeLoad } = require('js-yaml');

function load(dirname, component) {
    const path = join(dirname, component.id, 'cli.yaml');
    const file = readFileSync(path, 'utf8');
    return safeLoad(file);
}

module.exports = {
    load,
};
