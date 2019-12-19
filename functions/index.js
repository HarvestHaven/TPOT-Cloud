// // https://firebase.google.com/docs/functions/write-firebase-functions
const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()
const spawn = require('child-process-promise').spawn
const path = require('path')
const os = require('os')
const fs = require('fs')

const convertToHtml = require('../src/shared/utilities/converter').convertFile

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

    console.log(`Content type of ${object.name}: `, contentType)

    if (!object.name.endsWith('docx') || !contentType.startsWith('blob/')) {
        return console.log(`${object.name} is not a docx file`)
    }

})