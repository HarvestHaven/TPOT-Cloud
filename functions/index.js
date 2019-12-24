// // https://firebase.google.com/docs/functions/write-firebase-functions
const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()
const path = require('path')
const os = require('os')
const fs = require('fs')

const convertToHtml = require('./converter').convertFile

const inFolder = 'process';
const outFolder = 'download';
const checkoutFolder = 'checkout';

/**
 * Upload a given file to Firebase Storage
 */
function upload(file) {
    const fileName = file.name || null;
    return firebase
        .storage()
        .ref()
        .child(`{inFolder}/${fileName}`)
        .put(file)
        .then(snapshot => console.log(!!snapshot ? "upload success" : "upload failed"))
}

/**
 * TODO: Download the given file to server
 */
function download(file) {
    //TODO: Download the actual file contents (docx) from Firebase Storage and return the result
}


/**
 * TODO: Convert a given file from docx to html
 * TODO: Make this a triggered piece of code, possibly /triggers/conversion.js
 */
function convert(file) {
    //TODO: Download the actual file contents (docx)
    //TODO: convert the file.    
    convertToHtml(file)
        .then((html) => {
            console.log('Conversion result: \n', html)
            //TODO: Upload converter html file back to Firebase Storage
            // htmlRef.Upload(html) ...
        }).catch(console.error);
}

exports.convertDocx = functions.storage.object().onFinalize(async (object) => {

    const contentType = object.contentType
    const fileBucket = object.bucket;
    const filePath = object.name;

    console.log(`Content type of ${object.name}: `, contentType)
    //!object.name.endsWith('docx') || 
    if (!contentType.includes('officedocument')) {
        return console.log(`${object.name} is not a docx file`)
    }

    console.log(`Starting conversion of ${object.name}...`);

    // Download file from bucket.
    const bucket = admin.storage().bucket(fileBucket);
    const fileName = path.basename(filePath);
    const tempFilePath = path.join(os.tmpdir(), fileName);

    const metadata = {
        contentType: contentType,
    };

    await bucket.file(filePath)
        .download({ destination: tempFilePath });

    console.log('Docx downloaded locally to', tempFilePath);

    // const file = fs.readFileSync(tempFilePath);
    // console.log(`File ${file} had been red by Node!`, file);

    var html = await convertToHtml(tempFilePath)
    console.log('html:', html);

    //Write html to temp
    fs.writeFileSync(`${tempFilePath}.html`, html);
    console.log(`Html created at ${tempFilePath}.html`);

    // const htmlFileName = `html_${fileName}`;
    // const htmlFilePath = path.join(path.dirname(filePath), htmlFileName);

    // //Re-upload after conversion
    // await bucket.upload(tempFilePath, {
    //     destination: htmlFilePath,
    //     metadata: metadata
    // })

    // //Deletes temp file after conversion
    // return fs.unlinkSync(tempFilePath);
})