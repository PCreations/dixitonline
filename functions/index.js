const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { default: dixit } = require('./build/dixit');

console.log(dixit);

const firebaseApp = admin.initializeApp();

const app = dixit({ firestore: firebaseApp.firestore(), firebaseAuth: firebaseApp.auth() });

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.api = functions.https.onRequest(app);
