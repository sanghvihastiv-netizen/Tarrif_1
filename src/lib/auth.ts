import crypto from 'crypto';
import { db } from './database';


export interface AuthUser {
  id: number | string;
  email: string | null;
  displayName: string;
}


function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}


export function createUserAccount(email: string, password: string, displayName?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = (displayName || normalizedEmail.split('@')[0]).trim();


  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    throw new Error('An account with this email already exists');
  }


  const result = db
    .prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)')
    .run(normalizedEmail, hashPassword(password), normalizedName);


  return {
    id: Number(result.lastInsertRowid),
    email: normalizedEmail,
    displayName: normalizedName,
  } as AuthUser;
}


export function verifyUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const row = db
    .prepare('SELECT id, email, name AS displayName FROM users WHERE email = ? AND password = ?')
    .get(normalizedEmail, hashPassword(password));


  if (!row) {
    return null;
  }


  return row as AuthUser;
}


export function findUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const row = db.prepare('SELECT id, email, name AS displayName FROM users WHERE email = ?').get(normalizedEmail);
  return row as AuthUser | undefined;
}



