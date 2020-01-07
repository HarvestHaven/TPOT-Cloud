// const admin = require('firebase-admin');
const functions = require('firebase-functions')
// admin.initializeApp({}, name = "sessions");

export default functions.
    database.ref('session')
    .onCreate((snapshot, context) => {
        console.log('Hello from addNewSession()!  Looks like you are trying to update!');
    })
