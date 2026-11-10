const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { firebaseClientEmail, firebasePrivateKey, firebaseProjectId } = require('./env');

function getFirebaseAuth() {
  if (!getApps().length) {
    if (!firebaseProjectId || !firebaseClientEmail || !firebasePrivateKey) {
      throw new Error('Configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY');
    }

    initializeApp({
      credential: cert({
        projectId: firebaseProjectId,
        clientEmail: firebaseClientEmail,
        privateKey: firebasePrivateKey,
      }),
    });
  }

  return getAuth();
}

module.exports = { getFirebaseAuth };
