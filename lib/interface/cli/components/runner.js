const Promise = require('bluebird');
const { spawn } = require('child_process');
const fs = require('fs');

function run(process, binary, argument) {
    const deferred = Promise.defer();
    fs.chmodSync(binary, '755');
    const cmd = spawn(binary, argument);
    cmd.stdout.pipe(process.stdout);
    cmd.stderr.pipe(process.stderr);
    process.stdin.pipe(cmd.stdin);
    cmd.on('close', (code) => {
        if (code !== 0) {
            deferred.reject(new Error(`Command: ${binary} ${argument} exited with code: ${code}`));
        }
        deferred.resolve();
    });

    return deferred.promise;
}

module.exports = {
    run,
};
