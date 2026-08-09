import 'server-only';

import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { applicationDefault, cert, getApp, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function loadServiceAccount(): ServiceAccount | null {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();

  if (projectId && clientEmail && privateKey) return { projectId, clientEmail, privateKey };

  if (process.env.NODE_ENV !== 'production') {
    const credentialPath = path.join(process.cwd(), 'firebase-service-account.json');
    if (existsSync(credentialPath)) {
      return JSON.parse(readFileSync(credentialPath, 'utf8')) as ServiceAccount;
    }
  }

  return null;
}

function initializeFirebaseAdmin() {
  if (getApps().length) return getApp();
  const serviceAccount = loadServiceAccount();
  return initializeApp({ credential: serviceAccount ? cert(serviceAccount) : applicationDefault() });
}

const firebaseAdminApp = initializeFirebaseAdmin();

export const adminAuth = getAuth(firebaseAdminApp);
export const firestore = getFirestore(firebaseAdminApp);
