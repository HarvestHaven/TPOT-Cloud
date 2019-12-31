const admin = require('firebase-admin');
const functions = require('firebase-functions')
// admin.initializeApp(functions.config().firebase)

// var firebaseConfig = {
//     apiKey: "AIzaSyCrRjT-eZQAxfPkDemOe0WiebiWVZju97w",
//     authDomain: "tpot-toolbox.firebaseapp.com",
//     databaseURL: "https://tpot-toolbox.firebaseio.com",
//     projectId: "tpot-toolbox",
//     storageBucket: "tpot-toolbox.appspot.com",
//     messagingSenderId: "971065099433",
//     appId: "1:971065099433:web:eb274719dc83525e"
// };
// // Initialize Firebase
// admin.initializeApp(firebaseConfig);


let db = admin.firestore()


/* Uploads a given file as a new or updated session */
async function uploadAsSession(html) {

    // if (!html) throw new Error('Cannot load empty html string!')

    console.info('upload(): Uploading html into a session.')

    let data = {
        name: 'Fort Worth',
        state: 'TX',
        country: 'USA',
        html: html
    };

    // Add a new document in collection "cities" with ID 'LA'
    let setDoc = db.collection('cities').doc('DAL').set(data)
        .then((snapshot) => { console.log(!!snapshot ? 'Update success!' : 'Update failed, see error') })
        .catch(console.error)

    // const sessionRef = db.collection(collectionName)
    //     .doc(nextSession.documentName)

    // console.log('session ref: ', !!sessionRef);
    // sessionRef.set

    // sessionRef.set(nextSession, { merge: true })
    //     .then(snapshot => console.log(snapshot))
    //     .catch(console.error)
}

exports.uploadAsSession = uploadAsSession

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