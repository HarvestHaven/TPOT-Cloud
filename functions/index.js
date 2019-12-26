/*
Firebase
Writing functions:
https://firebase.google.com/docs/functions/write-firebase-functions */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
admin.initializeApp(functions.config().firestore);
let db = admin.firestore();


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
            .then(() => console.log('Docx downloaded locally to', localFilePath))

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

/* Uploads a given file as a new or updated session */
// async function uploadAsSession(html) {

//     // const html = readFileAsync(htmlFileName)
//     // if (!html) throw new Error('Cannot load empty html string!')

//     console.info('Uploading html into a session.')


//     // console.log(db);
//     let docRef = db.collection('users').doc('alovelace');
//     console.log(!!docRef)

//     let setAda = docRef.set({
//         first: 'Ada',
//         last: 'Lovelace',
//         born: 1815
//     })
//         .catch(console.error)

//     // const sessionRef = db.collection(collectionName)
//     //     .doc(nextSession.documentName)

//     // console.log('session ref: ', !!sessionRef);
//     // sessionRef.set

//     // sessionRef.set(nextSession, { merge: true })
//     //     .then(snapshot => console.log(snapshot))
//     //     .catch(console.error)
// }

// exports.uploadAsSession = uploadAsSession

// exports.uploadFile = async function uploadFile(localFilePath = null) {
//     if (!localFilePath) throw new Error('A local file path cannot be empty!')
//     storageRef = firebase.storage().ref();
//     let folderName = 'tmp'
//     let fileName = basename(localFilePath)
//     let fileRef = storageRef.child(`${folderName}/${fileName}`);

//     // var file = 

//     fileRef.put(file)
//         .then(snapshot => alert(!!snapshot
//             ? `Yay! File ${fileName} uploaded successfully!`
//             : `Fail! ${fileName} could not be uploaded!`))
//         .catch((error) => {
//             alert(error.message)
//         })


//     // bucket.upload(htmlFilePath, {
//     //     destination: htmlFilePath,
//     //     metadata: metadata
//     // })
// }