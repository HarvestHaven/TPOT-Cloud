const admin = require('firebase-admin');
// admin.initializeApp(admin.config().firestore);
// let firestore = admin.firestore();


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