
/*
Firebase
Writing functions:
https://firebase.google.com/docs/functions/write-firebase-functions */

const admin = require('firebase-admin')
const functions = require('firebase-functions')
// admin.initializeApp()
admin.initializeApp(functions.config().firestore)

const db = admin.firestore()
// const { uploadAsSession } = require('../database/sessions')

/** Local IO */
const path = require('path')
const os = require('os')
const fs = require('fs')
const convertToHtml = require('./converter').convertFile

exports.convertDocxToHtml = functions.storage.object()
    .onFinalize(async (object) => {

        const contentType = object.contentType
        const fileBucket = object.bucket
        const filePath = object.name
        const bucket = admin.storage().bucket(fileBucket)
        const fileName = path.basename(filePath)
        const localFilePath = path.join(os.tmpdir(), fileName)

        await uploadAsSession('<body/>')

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

        await bucket.file(filePath)
            .download({ destination: localFilePath })
            .then(() => console.log('Docx downloaded locally to', localFilePath))
            .catch(console.error)

        /* Convert and receive where Html was saved */
        // let htmlFilePath = await convertToHtml(localFilePath)
        await convertToHtml(localFilePath)
            .then(async (html) => {
                console.info('Calling uploadAsSession()', !!html)
                // console.log(html);
                // await uploadAsSession(html)
            })
            .catch(console.error)

        // console.log('Re-Uploading temp html file');
        // await bucket.upload(htmlFilePath, {
        //     destination: htmlFilePath,
        //     metadata: metadata
        // })

        /* Delete temp files after conversion */
        return fs.unlinkSync(localFilePath)
    })




/* Uploads a given file as a new or updated session */
async function uploadAsSession(html) {

    // if (!html) throw new Error('Cannot load empty html string!')

    console.info('upload(): Uploading html into a session.')

    let data = {
        name: 'test',
        state: 'test',
        country: 'USA',
        html: html
    };
    console.log('data to upload: ', data);
    // Add a new document in collection "cities" with ID 'LA'
    let setDoc = db.collection('cities2').doc('FW').set(data)
        .then((snapshot) => { console.log(!!snapshot ? 'Update success!' : 'Update failed, see error') })
        .catch(console.error)
}