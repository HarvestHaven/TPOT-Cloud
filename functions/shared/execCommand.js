const { exec } = require('child_process');
/**
 * Executes a shell command and return it as a Promise.
 * @param shellCommand {string}
 * @return {Promise<string>}
 */
function execCommand(shellCommand) {
    return new Promise((resolve) => {
        exec(shellCommand, () => {
            // if (error) {
            //     console.warn(error);
            // }
            // resolve(stdout ? stdout : stderr);
            resolve(true);
        });
    });
}
exports.execCommand = execCommand;
