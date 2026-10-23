import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateSafePublicUrl } from '../lib/utils/sanitizer';
import { validateAdminLogin, createSessionToken, verifySessionToken } from '../lib/auth/admin';
import { reportRepository } from '../lib/storage/repository';
import { processAssistantMessage } from '../lib/gemini/assistant';
import { SignalReport } from '../lib/schemas/report';

describe('Security & Privacy Boundary Verification', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    reportRepository.resetToDemo();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('SSRF Hardening & IP Range Validation', () => {
    it('blocks the full RFC 1918 172.16.0.0/12 range', () => {
      expect(validateSafePublicUrl('http://172.16.0.1/status').valid).toBe(false);
      expect(validateSafePublicUrl('http://172.20.5.10/admin').valid).toBe(false);
      expect(validateSafePublicUrl('http://172.31.255.254/internal').valid).toBe(false);
    });

    it('blocks IPv6 loopback and bracketed intranet destinations', () => {
      expect(validateSafePublicUrl('http://[::1]:3000').valid).toBe(false);
      expect(validateSafePublicUrl('http://[fe80::1]/service').valid).toBe(false);
    });

    it('blocks numeric IPv4 representations (integer bypasses)', () => {
      // 2130706433 is 127.0.0.1 in decimal integer format
      expect(validateSafePublicUrl('http://2130706433').valid).toBe(false);
      expect(validateSafePublicUrl('http://0x7f000001').valid).toBe(false);
    });

    it('blocks URLs with embedded credentials to prevent credential leaking', () => {
      expect(validateSafePublicUrl('https://admin:supersecret@mycivicportal.org').valid).toBe(false);
    });

    it('blocks private internal TLDs (.local, .internal, .lan)', () => {
      expect(validateSafePublicUrl('http://gateway.local/api').valid).toBe(false);
      expect(validateSafePublicUrl('http://control-plane.internal').valid).toBe(false);
      expect(validateSafePublicUrl('http://router.lan/setup').valid).toBe(false);
    });
  });

  describe('Production Auth Hardening', () => {
    it('refuses login in production when password hash is not configured', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      delete process.env.ADMIN_PASSWORD_HASH;
      expect(validateAdminLogin('admin', 'any-password')).toBe(false);
    });

    it('fails safely when signing session tokens in production with weak or default secrets', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      process.env.ADMIN_SESSION_SECRET = 'insecure-default-demo-secret-replace-in-env';
      expect(() => createSessionToken('admin')).toThrow(/ADMIN_SESSION_SECRET must be configured/);

      process.env.ADMIN_SESSION_SECRET = 'too-short';
      expect(() => createSessionToken('admin')).toThrow(/ADMIN_SESSION_SECRET must be configured/);
    });

    it('returns null safely when verifying tokens in production with invalid secret', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      process.env.ADMIN_SESSION_SECRET = 'too-short';
      expect(verifySessionToken('invalid.token')).toBeNull();
    });
  });

  describe('Cross-User Assistant Query Isolation & Medical Privacy', () => {
    it('prevents assistant from reading a private report belonging to another user', async () => {
      const privateReport: SignalReport = {
        id: 'sb-secret-user1-report',
        userId: 'user_111',
        title: 'Private grievance about water line leak',
        summary: 'Secret leak investigation details',
        category: 'civic_infrastructure',
        sourceLanguage: 'en',
        preferredResponseLanguage: 'en',
        status: 'under_review',
        urgency: 'high',
        isEmergency: false,
        facts: [],
        entities: [],
        evidence: [],
        missingInformation: [],
        contradictions: [],
        verification: {
          isIndependentlyVerified: false,
          verificationNote: 'Pending verification',
          sourcesChecked: [],
          unverifiedClaims: [],
        },
        recommendedActions: [],
        publicVisibility: 'private',
        isDemoData: false,
        deleteSecret: 'token-111',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      reportRepository.save(privateReport);

      // User 222 queries the assistant asking about User 111's report
      const res = await processAssistantMessage(
        {
          message: 'What is the status of report sb-secret-user1-report?',
          currentReportId: 'sb-secret-user1-report',
        },
        'user_222' // Unrelated caller
      );

      // Caller is not owner and report is private: referencedReport must NOT be returned
      expect(res.referencedReport).toBeUndefined();
    });

    it('allows assistant to reference a report if the caller is the verified owner', async () => {
      const userReport: SignalReport = {
        id: 'sb-owner-report',
        userId: 'user_333',
        title: 'Road blockage in Shivaji Nagar',
        summary: 'Fallen tree blocking lane',
        category: 'traffic_road_safety',
        sourceLanguage: 'en',
        preferredResponseLanguage: 'en',
        status: 'submitted',
        urgency: 'medium',
        isEmergency: false,
        facts: [],
        entities: [],
        evidence: [],
        missingInformation: [],
        contradictions: [],
        verification: {
          isIndependentlyVerified: false,
          verificationNote: 'Self-reported',
          sourcesChecked: [],
          unverifiedClaims: [],
        },
        recommendedActions: [],
        publicVisibility: 'private',
        isDemoData: false,
        deleteSecret: 'token-333',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      reportRepository.save(userReport);

      const res = await processAssistantMessage(
        {
          message: 'Can you summarize my report?',
          currentReportId: 'sb-owner-report',
        },
        'user_333' // Verified owner
      );

      expect(res.referencedReport).toBeDefined();
      expect(res.referencedReport?.id).toBe('sb-owner-report');
      expect(res.referencedReport?.title).toBe('Road blockage in Shivaji Nagar');
    });

    it('strictly denies public or non-owner assistant access to medical health records', async () => {
      const medicalReport: SignalReport = {
        id: 'sb-patient-record-001',
        userId: 'patient_444',
        title: 'Diabetes HbA1c Lab Report',
        summary: 'Patient HbA1c test level 7.2%',
        category: 'medical_health_records',
        sourceLanguage: 'en',
        preferredResponseLanguage: 'en',
        status: 'submitted',
        urgency: 'medium',
        isEmergency: false,
        facts: [],
        entities: [],
        evidence: [],
        missingInformation: [],
        contradictions: [],
        verification: {
          isIndependentlyVerified: false,
          verificationNote: 'Patient uploaded',
          sourcesChecked: [],
          unverifiedClaims: [],
        },
        recommendedActions: [],
        publicVisibility: 'approved', // Even if visibility was mistakenly set to approved
        isDemoData: false,
        deleteSecret: 'patient-token',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      reportRepository.save(medicalReport);

      // Verify medical record is NEVER in public repository list
      const publicReports = reportRepository.getPublicReports();
      expect(publicReports.find((r) => r.id === 'sb-patient-record-001')).toBeUndefined();

      // Verify non-owner assistant query cannot reference medical records
      const res = await processAssistantMessage(
        {
          message: 'Show me details for sb-patient-record-001',
          currentReportId: 'sb-patient-record-001',
        },
        'random_user_555'
      );
      expect(res.referencedReport).toBeUndefined();
    });
  });
});
