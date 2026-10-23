import { describe, it, expect } from 'vitest';
import {
  SignalReportSchema,
  PublicSafeReportSchema,
  ProvenanceEnum,
  CategoryEnum,
  UrgencyEnum,
  WorkflowStatusEnum,
} from '../lib/schemas/report';

describe('SignalBridge Canonical Report Schema', () => {
  const validReportSample = {
    id: 'sb-test-101',
    title: 'Damaged storm water drain cover',
    summary: 'Heavy iron grill broken creating road hazard for two wheelers',
    category: 'civic_infrastructure',
    sourceLanguage: 'en',
    detectedLanguageName: 'English',
    preferredResponseLanguage: 'en',
    status: 'submitted',
    urgency: 'high',
    isEmergency: false,
    facts: [
      {
        id: 'f-1',
        statement: 'Cast iron drain lid is broken into two pieces',
        provenance: 'extracted_from_source',
        sourceReference: 'photo.jpg',
      },
      {
        id: 'f-2',
        statement: 'Reported by commuter on 5th main road',
        provenance: 'user_reported',
      },
      {
        id: 'f-3',
        statement: 'Site verification by municipal road supervisor pending',
        provenance: 'needs_confirmation',
      },
    ],
    entities: [
      { name: 'Infrastructure', type: 'other', value: 'Storm Drain' },
    ],
    location: {
      rawInput: '5th Main Road, Pune',
      locality: 'Kothrud',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      approximateCoordinates: { lat: 18.5074, lng: 73.8077 },
      isApproximate: true,
    },
    incidentDate: '2026-10-22',
    evidence: [
      {
        id: 'ev-1',
        fileName: 'photo.jpg',
        fileType: 'image',
        extractedSnippet: 'Broken iron grate over drain',
        isVerifiedContent: true,
      },
    ],
    missingInformation: ['Drain asset inventory code'],
    contradictions: [],
    verification: {
      isIndependentlyVerified: false,
      verificationNote: 'Community reported. Ground inspection pending.',
      sourcesChecked: ['Pune PMC Grievance Desk'],
      unverifiedClaims: ['Exact depth of chamber'],
    },
    recommendedActions: [
      {
        id: 'act-1',
        title: 'Report to PMC Drainage Maintenance',
        targetEntity: 'Pune Municipal Corporation',
        portalOrDesk: 'PMC Care App',
        steps: ['Log complaint under Road Assets category', 'Attach photo'],
        prerequisites: ['Citizen mobile number'],
        actionType: 'portal_submission',
      },
    ],
    publicVisibility: 'pending',
    isDemoData: false,
    deleteSecret: 'secret1234567890',
    adminNotes: 'Assigned to Ward 12 supervisor for review',
    createdAt: '2026-10-22T10:00:00.000Z',
    updatedAt: '2026-10-22T10:00:00.000Z',
  };

  it('validates a complete, compliant SignalReport', () => {
    const result = SignalReportSchema.safeParse(validReportSample);
    expect(result.success).toBe(true);
  });

  it('rejects reports with invalid urgency levels', () => {
    const invalid = { ...validReportSample, urgency: 'super-urgent' };
    const result = SignalReportSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('enforces strict provenance enum values', () => {
    expect(ProvenanceEnum.safeParse('user_reported').success).toBe(true);
    expect(ProvenanceEnum.safeParse('extracted_from_source').success).toBe(true);
    expect(ProvenanceEnum.safeParse('independently_verified').success).toBe(true);
    expect(ProvenanceEnum.safeParse('needs_confirmation').success).toBe(true);
    expect(ProvenanceEnum.safeParse('ai_invented').success).toBe(false);
  });

  it('ensures PublicSafeReportSchema strips deleteSecret and adminNotes', () => {
    const safeParsed = PublicSafeReportSchema.safeParse(validReportSample);
    expect(safeParsed.success).toBe(true);
    if (safeParsed.success) {
      expect((safeParsed.data as any).deleteSecret).toBeUndefined();
      expect((safeParsed.data as any).adminNotes).toBeUndefined();
    }
  });

  it('requires title and summary to not be empty strings', () => {
    const invalid = { ...validReportSample, title: '', summary: '' };
    const result = SignalReportSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
