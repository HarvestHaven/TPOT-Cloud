/*
Firebase
Writing functions:
https://firebase.google.com/docs/functions/write-firebase-functions */
const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firestore)
let db = admin.firestore()

/** Local IO */
const path = require('path')
const { basename } = require('path')
const os = require('os')
const fs = require('fs')
const convertToHtml = require('./converter').convertFile
const { readFileAsync } = require('./readFileAsync')

exports.convertDocx = functions.storage.object()
    .onFinalize(async (object) => {

        const contentType = object.contentType

        if (!contentType.includes('officedocument') || !object.name.endsWith('docx')) {
            //TODO: find a way to filter only DOCX for this trigger - save function calls!
            return console.info(`${object.name} is not a docx file!  Conversion aborted.`)
        }

        const fileBucket = object.bucket
        const filePath = object.name

        console.info(`Content type of ${object.name}: `, contentType)


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

        /* Push to Database */
        uploadAsSession(htmlFilePath)

        /* Deletes temp file after conversion */
        return fs.unlinkSync(tempFilePath)
    })

/* Uploads a given file as a new or updated session */
async function uploadAsSession(htmlFilePath = null) {

    
    if (!htmlFilePath) throw new Error(`Html file path cannot be empty!`)
    
    const html = readFileAsync(htmlFilePath)
    if (!html) throw new Error('Cannot load empty html string!')

    console.info('Uploading html into a session.')
    const now = Date.now()
    const collectionName = "sessions"
    const fileName = basename(htmlFilePath)

    let nextSession = {
        documentName: fileName,
        author: null,
        draftStates: {
            originalState: "html",
            editor: "html",
            created: now,
            lastModified: now
        }
    }

    const sessionRef = db.collection(collectionName)
        .doc(nextSession.documentName)

    sessionRef.set(nextSession, { merge: true })
        .then(snapshot => console.log(snapshot))
        .catch(console.error)
}