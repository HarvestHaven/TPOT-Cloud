const fs = require('fs');
function readFileAsync(filePath) {
    return new Promise((resolve) => {
        fs.readFile(filePath, (error, buffer) => {
            if (error)
                throw error;
            if (!buffer)
                throw new Error('Buffer could not be initialized!');
            // console.log("file data:", data);
            resolve(buffer);
        });
    });
}
exports.readFileAsync = readFileAsync;
