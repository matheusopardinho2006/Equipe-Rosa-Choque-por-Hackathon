require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 3333,
  mongoUri: process.env.MONGO_URI,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  adminFirebaseUid: process.env.ADMIN_FIREBASE_UID,
  adminEmail: process.env.ADMIN_EMAIL,
};
