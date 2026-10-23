import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'sb_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

export interface AdminSession {
  username: string;
  issuedAt: number;
}

/**
 * Verify plaintext password against configured scrypt hash: <salt>:<hash>
 */
export function verifyAdminPassword(plaintext: string): boolean {
  const configuredHash = process.env.ADMIN_PASSWORD_HASH;
  if (!configuredHash || !configuredHash.includes(':')) {
    // Admin password hash is not configured
    return false;
  }

  try {
    const [salt, expectedHashHex] = configuredHash.split(':');
    if (!salt || !expectedHashHex) return false;

    const actualHash = crypto.scryptSync(plaintext, salt, 64);
    const expectedHash = Buffer.from(expectedHashHex, 'hex');

    if (actualHash.length !== expectedHash.length) return false;
    return crypto.timingSafeEqual(actualHash, expectedHash);
  } catch {
    return false;
  }
}

function constantTimeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const DEFAULT_SECRET = 'insecure-default-demo-secret-replace-in-env';

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === DEFAULT_SECRET || secret.length < 32) {
      throw new Error('ADMIN_SESSION_SECRET must be configured with at least 32 characters in production.');
    }
    return secret;
  }
  return secret || DEFAULT_SECRET;
}

/**
 * Validate credentials against env config
 */
export function validateAdminLogin(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD_HASH) {
    // In production, strictly reject login if password hash is not configured
    return false;
  }
  if (!constantTimeEqualStrings(username, expectedUsername)) {
    return false;
  }
  return verifyAdminPassword(password);
}

/**
 * Generate a signed session token
 */
export function createSessionToken(username: string): string {
  const secret = getSessionSecret();
  const issuedAt = Date.now();
  const payload = `${username}:${issuedAt}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${signature}`;
}

/**
 * Verify signed session token and return admin session if valid
 */
export function verifySessionToken(token: string): AdminSession | null {
  if (!token || !token.includes('.')) return null;

  try {
    const secret = getSessionSecret();
    const [payloadB64, signature] = token.split('.');
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf-8');

    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const sigA = Buffer.from(signature, 'hex');
    const sigB = Buffer.from(expectedSignature, 'hex');

    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return null;
    }

    const [username, issuedAtStr] = payload.split(':');
    const issuedAt = parseInt(issuedAtStr, 10);
    const ageSeconds = (Date.now() - issuedAt) / 1000;

    if (ageSeconds > SESSION_MAX_AGE_SECONDS) {
      return null; // Expired session
    }

    return { username, issuedAt };
  } catch {
    return null;
  }
}

/**
 * Helper to check current admin session from incoming cookie header (Next.js server context)
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifySessionToken(sessionCookie.value);
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
