/**
 * A local path manager
 */
const path = require('path')

function getPath(fileName = null, directory = "") {

    let currentDirectory = directory || process.cwd()
    let htmlFileName = fileName.replace(".docx", ".html")
    let htmlFilePath = path.join(currentDirectory, htmlFileName)
    let filePath = path.join(currentDirectory)

    return {
        filePath,
        currentDirectory,
        htmlFilePath,
        htmlFileName
    }
}

exports.getPath = getPath