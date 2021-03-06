
/*
Firebase
Writing functions:
https://firebase.google.com/docs/functions/write-firebase-functions */

const admin = require('firebase-admin');
const functions = require('firebase-functions')
admin.initializeApp();

/** Local IO */
const path = require('path')
const os = require('os')
const fs = require('fs')
const convertToHtml = require('./converter').convertFile
const { sizeof } = require('./converter')

exports.convertDocxToHtml = functions.storage.object()
    .onFinalize(async (object) => {

        const contentType = object.contentType
        const fileBucket = object.bucket
        const filePath = object.name
        const bucket = admin.storage().bucket(fileBucket)
        const fileName = path.basename(filePath)
        const localFilePath = path.join(os.tmpdir(), fileName)

        // let currentDirectory = dirname(filePath)
        // let htmlFilePath = path.join(currentDirectory, basename(filePath).replace('docx', 'html'))

        // if (!object.name.endsWith('html')) {
        //     /* TODO: Push to Database */
        //     return
        //     let html = readFileAsync()
        // }

        if (!contentType.includes('officedocument') || !object.name.endsWith('docx')) {
            // IDEA: find a way to filter only DOCX for this trigger - save function calls!
            return console.info(`${object.name} is not a docx file!  Conversion aborted.`)
        }


        console.info(`Content type of ${object.name}: `, contentType)

        const metadata = {
            contentType: contentType,
        }

        // TODO: move to download function; (rule of 3).
        await bucket.file(filePath)
            .download({ destination: localFilePath })
            .then(() => console.log(`Docx downloaded locally to server at ${localFilePath}`))

        /* Convert and receive where Html was saved */
        let htmlFilePath = await convertToHtml(localFilePath)

        console.log('Re-Uploading temp html file');
        await bucket.upload(htmlFilePath, {
            destination: htmlFilePath,
            metadata: metadata
        })

        /* Delete temp files after conversion */
        return fs.unlinkSync(localFilePath)
    })

