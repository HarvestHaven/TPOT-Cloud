// // https://firebase.google.com/docs/functions/write-firebase-functions
const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()
const path = require('path')
const os = require('os')
const fs = require('fs')

const convertToHtml = require('./converter').convertFile
const outFolder = 'ready';
const checkoutFolder = 'checkout';

/**
 * Upload a given file to Firebase Storage
 */
function upload(file) {
    const fileName = file.name || null;
    return firebase
        .storage()
        .ref()
        .child(`${checkoutFolder}/${fileName}`)
        .put(file)
        .then(snapshot => console.log(!!snapshot ? "upload success" : "upload failed"))
}

/**
 * TODO: Download the given file to server
 */
function download(file) {
    /* TODO: Download the actual file contents (docx)
      from Firebase Storage and return the result */
}

exports.convertDocx = functions.storage.object()
    .onFinalize(async (object) => {

        const contentType = object.contentType
        const fileBucket = object.bucket
        const filePath = object.name

        console.info(`Content type of ${object.name}: `, contentType)
        //!object.name.endsWith('docx') || 
        if (!contentType.includes('officedocument')) {
            return console.error(`${object.name} is not a docx file!`)
        }

        /* Download file from bucket. */
        // TODO: move to download function; (rule of 3).
        const bucket = admin.storage().bucket(fileBucket)
        const fileName = path.basename(filePath)
        const tempFilePath = path.join(os.tmpdir(), fileName)

        const metadata = {
            contentType: contentType,
        }

        // TODO: move to download function; (rule of 3).
        await bucket.file(filePath)
            .download({ destination: tempFilePath })
            .then(() => console.log('Docx downloaded locally to', tempFilePath))

        /* Convert and receive where Html was saved */
        var htmlFilePath = await convertToHtml(tempFilePath)

        /* Re-upload after conversion */
        // TODO: move to upload function; (SRP).
        await bucket.upload(htmlFilePath, {
            destination: htmlFilePath,
            metadata: metadata
        })

        /* Deletes temp file after conversion */
        return fs.unlinkSync(tempFilePath)
    })