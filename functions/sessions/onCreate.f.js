// const admin = require('firebase-admin');
// const functions = require('firebase-functions')

// export default functions.firestore
//     // .collection('session')
//     .document('session/{sessionId}')
//     .onCreate((snapshot, context) => {
//         console.log('Hello from addNewSession()!  Looks like you are trying to update!');
//         const value = snapshot.data();
//         if (value) console.log('Here is the value: ', value);

//         resolve(value)
//         //...
//     })

import * as functions from 'firebase-functions'
import admin from 'firebase-admin'

export default functions
    .database.ref()
    .onCreate((snapshot, context) => {
        console.log('Yer fired!');


        
    })

// const functions = require('firebase-functions');

// exports.onCreated = functions.database
//     .ref('tpot-toolbox')
//     .onCreate((snapshot, context) => {

//         const paperSession = snapshot.val()
//         console.log('Paper session: ', paperSession)

//         // push data directly to firestore/sessions
//         let sessionRef = functions.firestore
//             .document('session')

//         console.log(sessionRef)
//         sessionRef.set(paperSession)
//     });




// const functions = require('firebase-functions');
// const admin = require('firebase-admin')

// module.exports = {
//     onCreated: () => {
//         return admin
//             .database()
//             .ref('tpot-toolbox')
//             .onCreate((snapshot, context) => {

//                 const paperSession = snapshot.val()
//                 console.log('Paper session: ', paperSession)

//                 // push data directly to firestore/sessions
//                 let sessionRef = functions.firestore
//                     .document('session')

//                 console.log(sessionRef)
//                 sessionRef.set(paperSession)
//             })
//     }