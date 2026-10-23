import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import {
  verifyAdminPassword,
  validateAdminLogin,
  createSessionToken,
  verifySessionToken,
} from '../lib/auth/admin';

describe('Admin Authentication & Security', () => {
  const originalEnv = { ...process.env };
  const testPassword = 'test-secure-admin-pass';
  let testSalt: string;
  let testHash: string;

  beforeEach(() => {
    testSalt = crypto.randomBytes(16).toString('hex');
    testHash = crypto.scryptSync(testPassword, testSalt, 64).toString('hex');

    process.env.ADMIN_USERNAME = 'test_admin';
    process.env.ADMIN_PASSWORD_HASH = `${testSalt}:${testHash}`;
    process.env.ADMIN_SESSION_SECRET = 'a-very-long-and-secure-test-secret-key-32-chars';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('verifies correct password against scrypt salt:hash', () => {
    expect(verifyAdminPassword(testPassword)).toBe(true);
  });

  it('rejects incorrect password', () => {
    expect(verifyAdminPassword('wrong-password')).toBe(false);
  });

  it('denies access if ADMIN_PASSWORD_HASH is missing or malformed', () => {
    process.env.ADMIN_PASSWORD_HASH = '';
    expect(verifyAdminPassword(testPassword)).toBe(false);

    process.env.ADMIN_PASSWORD_HASH = 'malformed-without-colon';
    expect(verifyAdminPassword(testPassword)).toBe(false);
  });

  it('validates admin username and password combination', () => {
    expect(validateAdminLogin('test_admin', testPassword)).toBe(true);
    expect(validateAdminLogin('wrong_admin', testPassword)).toBe(false);
    expect(validateAdminLogin('test_admin', 'wrong_pass')).toBe(false);
  });

  it('creates and successfully verifies signed session tokens', () => {
    const token = createSessionToken('test_admin');
    expect(token).toBeDefined();
    expect(token).toContain('.');

    const session = verifySessionToken(token);
    expect(session).not.toBeNull();
    expect(session?.username).toBe('test_admin');
    expect(session?.issuedAt).toBeGreaterThan(0);
  });

  it('rejects tampered session tokens', () => {
    const token = createSessionToken('test_admin');
    const [payloadB64, sig] = token.split('.');
    const tamperedPayload = Buffer.from('hacker:123456789').toString('base64url');
    const tamperedToken = `${tamperedPayload}.${sig}`;

    expect(verifySessionToken(tamperedToken)).toBeNull();
  });
});

import { calculateUserAchievements } from '../lib/auth/userSession';

describe('User Identity & Achievement Milestones', () => {
  it('calculates 0 submission baseline correctly with First Signal as next milestone', () => {
    const res = calculateUserAchievements(0);
    expect(res.totalSubmissions).toBe(0);
    expect(res.achievements.every((a) => !a.unlocked)).toBe(true);
    expect(res.nextMilestone?.id).toBe('first_report');
    expect(res.progressToNext).toBe(0);
  });

  it('unlocks First Signal milestone at 1 submission', () => {
    const res = calculateUserAchievements(1);
    expect(res.totalSubmissions).toBe(1);
    const firstBadge = res.achievements.find((a) => a.id === 'first_report');
    expect(firstBadge?.unlocked).toBe(true);
    expect(res.nextMilestone?.id).toBe('community_contributor');
    expect(res.progressToNext).toBe(0); // At 1 submission, 0 / (5 - 1) = 0% toward Community Contributor
  });

  it('unlocks Community Contributor milestone at 5 submissions', () => {
    const res = calculateUserAchievements(5);
    const badge5 = res.achievements.find((a) => a.id === 'community_contributor');
    expect(badge5?.unlocked).toBe(true);
    expect(res.nextMilestone?.id).toBe('active_contributor');
    expect(res.progressToNext).toBe(0); // At 5 submissions, 0 / (10 - 5) = 0% toward Active Contributor
  });

  it('unlocks all tiers at 25+ submissions and sets progress to 100%', () => {
    const res = calculateUserAchievements(25);
    expect(res.achievements.every((a) => a.unlocked)).toBe(true);
    expect(res.nextMilestone).toBeUndefined();
    expect(res.progressToNext).toBe(100);
  });
});
