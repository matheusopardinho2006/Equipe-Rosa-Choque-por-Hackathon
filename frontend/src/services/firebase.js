import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB_rhEzu7FRU374JE3qCH-D3o3q7pDcq7U',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'hackaton-karsten-therion.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'hackaton-karsten-therion',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:324053817012:web:a52b3971935adad86d69e1',
};

export const missingFirebaseConfig = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => key);

let app = null;
let auth = null;

if (config.apiKey && config.projectId) {
  try {
    app = getApps().length ? getApp() : initializeApp(config);
    auth = getAuth(app);
  } catch (err) {
    console.error('Erro ao inicializar Firebase:', err);
  }
}

export const firebaseAuth = auth;
