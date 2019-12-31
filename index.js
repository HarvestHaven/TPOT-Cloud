const admin = require('firebase-admin')
const serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseUrl: "https://tpot-toolbox.firebase.io"
})

const db = admin.firestore()


let data = {
    name: 'Fort Worth',
    state: 'TX',
    country: 'USA'
};

// Add a new document in collection "cities" with ID 'LA'
let setDoc = db.collection('cities').doc('FW').set(data)
    .then(() => { })
    .catch(console.error)


