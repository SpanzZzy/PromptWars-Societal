import { describe, it, expect, beforeEach } from 'vitest';
import { reportRepository } from '../lib/storage/repository';
import { SignalReport } from '../lib/schemas/report';

describe('ReportRepository Persistence & Data Integrity', () => {
  beforeEach(() => {
    // Reset repository state to clean demo baseline
    reportRepository.resetToDemo();
  });

  it('initializes with seed demo reports', () => {
    const all = reportRepository.getAll({ includePrivate: true });
    expect(all.length).toBeGreaterThanOrEqual(3);

    const publicReports = reportRepository.getPublicReports();
    expect(publicReports.length).toBeGreaterThanOrEqual(2);
  });

  it('only returns approved reports in getPublicReports() and strips secret tokens', () => {
    // Add a private report
    const privateReport: SignalReport = {
      id: 'sb-private-001',
      title: 'Private grievance report',
      summary: 'Confidential citizen inquiry',
      category: 'document_public_service',
      sourceLanguage: 'en',
      preferredResponseLanguage: 'en',
      status: 'submitted',
      urgency: 'low',
      isEmergency: false,
      facts: [],
      entities: [],
      location: { locality: 'Kalyan', isApproximate: true, country: 'India' },
      evidence: [],
      missingInformation: [],
      contradictions: [],
      verification: {
        isIndependentlyVerified: false,
        verificationNote: 'Self reported',
        sourcesChecked: [],
        unverifiedClaims: [],
      },
      recommendedActions: [],
      publicVisibility: 'private', // Strictly private
      isDemoData: false,
      deleteSecret: 'my-super-secret-delete-token',
      adminNotes: 'Do not publish to public map without consent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    reportRepository.save(privateReport);

    const publicList = reportRepository.getPublicReports();
    const foundPrivate = publicList.find((r) => r.id === 'sb-private-001');
    expect(foundPrivate).toBeUndefined();

    // Verify all public reports have deleted secrets and admin notes stripped
    for (const pub of publicList) {
      expect((pub as any).deleteSecret).toBeUndefined();
      expect((pub as any).adminNotes).toBeUndefined();
      if (pub.location) {
        expect(pub.location.isApproximate).toBe(true);
      }
    }
  });

  it('updates workflow status and notes properly', () => {
    const updated = reportRepository.update('sb-pune-001', {
      status: 'action_taken',
      adminNotes: 'Field team dispatched on 23-Oct',
    });

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('action_taken');
    expect(updated?.adminNotes).toBe('Field team dispatched on 23-Oct');

    const fetched = reportRepository.getById('sb-pune-001');
    expect(fetched?.status).toBe('action_taken');
  });

  it('allows self-service deletion only when deleteSecret matches', () => {
    const customReport: SignalReport = {
      id: 'sb-delete-test',
      title: 'Temporary report for deletion test',
      summary: 'Testing self service deletion',
      category: 'civic_infrastructure',
      sourceLanguage: 'en',
      preferredResponseLanguage: 'en',
      status: 'submitted',
      urgency: 'low',
      isEmergency: false,
      facts: [],
      entities: [],
      evidence: [],
      missingInformation: [],
      contradictions: [],
      verification: {
        isIndependentlyVerified: false,
        verificationNote: 'Test',
        sourcesChecked: [],
        unverifiedClaims: [],
      },
      recommendedActions: [],
      publicVisibility: 'pending',
      isDemoData: false,
      deleteSecret: 'exact-matching-secret-token',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    reportRepository.save(customReport);

    // Attempt deletion with wrong secret
    const failDelete = reportRepository.delete('sb-delete-test', {
      deleteSecret: 'wrong-secret',
      isAdmin: false,
    });
    expect(failDelete).toBe(false);
    expect(reportRepository.getById('sb-delete-test')).not.toBeNull();

    // Deletion with correct secret succeeds
    const successDelete = reportRepository.delete('sb-delete-test', {
      deleteSecret: 'exact-matching-secret-token',
      isAdmin: false,
    });
    expect(successDelete).toBe(true);
    expect(reportRepository.getById('sb-delete-test')).toBeNull();
  });

  it('calculates correct operational statistics', () => {
    const stats = reportRepository.getStats();
    expect(stats.total).toBeGreaterThanOrEqual(3);
    expect(stats.demographics.civicInfrastructure).toBeGreaterThanOrEqual(1);
    expect(stats.demographics.documentPublicService).toBeGreaterThanOrEqual(1);
    expect(stats.lastUpdated).toBeDefined();
  });

  it('isolates user reports by userId and excludes demo reports from user counts', () => {
    const userA = 'user_guest_aaa';
    const userB = 'user_guest_bbb';

    const reportA: SignalReport = {
      id: 'sb-userA-001',
      userId: userA,
      title: 'Water pipe leak in Kalyani Nagar',
      summary: 'Pipeline leaking clean water',
      category: 'civic_infrastructure',
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
        verificationNote: 'Field inspection scheduled',
        sourcesChecked: [],
        unverifiedClaims: [],
      },
      recommendedActions: [],
      publicVisibility: 'pending',
      isDemoData: false,
      deleteSecret: 'token-a',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    reportRepository.save(reportA);

    const userAReports = reportRepository.getUserReports(userA);
    const userBReports = reportRepository.getUserReports(userB);

    expect(userAReports.length).toBe(1);
    expect(userAReports[0].id).toBe('sb-userA-001');
    expect(userBReports.length).toBe(0);

    expect(reportRepository.getUserSubmissionCount(userA)).toBe(1);
    expect(reportRepository.getUserSubmissionCount(userB)).toBe(0);

    // Test owner deletion with userId
    const deleteByWrongUser = reportRepository.delete('sb-userA-001', { userId: userB });
    expect(deleteByWrongUser).toBe(false);
    expect(reportRepository.getById('sb-userA-001')).not.toBeNull();

    const deleteByOwner = reportRepository.delete('sb-userA-001', { userId: userA });
    expect(deleteByOwner).toBe(true);
    expect(reportRepository.getById('sb-userA-001')).toBeNull();
  });
});
