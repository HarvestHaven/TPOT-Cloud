
/*
Firebase
Writing functions:
https://firebase.google.com/docs/functions/write-firebase-functions */
const admin = require('firebase-admin');
const functions = require('firebase-functions')
var database = admin.database()

/** Local IO */
const path = require('path')
const os = require('os')
const fs = require('fs')
const convertToHtml = require('./converter').convertFile
const { sizeof } = require('./converter')

export default functions
    .storage
    .object()
    .onFinalize(async (object) => {

        const contentType = object.contentType
        const fileBucket = object.bucket
        const filePath = object.name
        const bucket = admin.storage().bucket(fileBucket)
        const fileName = path.basename(filePath)
        const localFilePath = path.join(os.tmpdir(), fileName)

        if (!contentType.includes('officedocument') || !object.name.endsWith('.docx')) {
            // IDEA: find a way to filter only DOCX for this trigger - save function calls!
            return null // console.info(`${object.name} is not a docx file!  Conversion aborted.`)
        }

        // console.info(`Content type of ${object.name}: `, contentType)

        const metadata = {
            contentType: contentType,
        }

        await bucket.file(filePath)
            .download({ destination: localFilePath })
            .then(() => console.log(`Docx downloaded locally to server at ${localFilePath}`))

        /* Convert and receive where Html was saved */
        let { htmlFilePath, html } = await convertToHtml(localFilePath)
            .catch((error) => {
                console.error(error);
                return null;
            })

        if (!htmlFilePath)
            return null;

        database
            // .ref('test/' + filePath)
            .ref()
            .set({
                html,
                author: "Michael Preston"
            })

        console.log('Re-Uploading temp html file');
        await bucket.upload(htmlFilePath, {
            destination: htmlFilePath,
            metadata: metadata
        })

        /* Delete temp files after conversion */
        console.log('Cleaning up');
        fs.unlinkSync(htmlFilePath)
        return fs.unlinkSync(localFilePath)
    })