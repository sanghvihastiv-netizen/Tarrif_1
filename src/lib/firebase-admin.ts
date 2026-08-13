import 'server-only';

import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { applicationDefault, cert, getApp, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function normalizePrivateKey(raw: string) {
  let value = raw.trim();

  if (value.startsWith('{')) {
    const parsed = JSON.parse(value) as { private_key?: unknown };
    if (typeof parsed.private_key === 'string') value = parsed.private_key;
  } else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    try {
      value = JSON.parse(value) as string;
    } catch {
      value = value.slice(1, -1);
    }
  }

  return value.replace(/\\r/g, '').replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim();
}

function loadServiceAccount(): ServiceAccount | null {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY ? normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY) : '';

  if (projectId && clientEmail && privateKey) {
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
      throw new Error('FIREBASE_PRIVATE_KEY is not a valid PEM private key. Copy the private_key value from the service-account JSON.');
    }
    return { projectId, clientEmail, privateKey };
  }

  if (process.env.NODE_ENV !== 'production') {
    const credentialPath = path.join(process.cwd(), 'firebase-service-account.json');
    if (existsSync(credentialPath)) return JSON.parse(readFileSync(credentialPath, 'utf8')) as ServiceAccount;
  }

  return null;
}

let firebaseAdminApp: App | null = null;

function getFirebaseAdminApp() {
  if (firebaseAdminApp) return firebaseAdminApp;
  if (getApps().length) {
    firebaseAdminApp = getApp();
    return firebaseAdminApp;
  }

  const serviceAccount = loadServiceAccount();
  firebaseAdminApp = initializeApp({ credential: serviceAccount ? cert(serviceAccount) : applicationDefault() });
  return firebaseAdminApp;
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getFirebaseAdminApp());
}
