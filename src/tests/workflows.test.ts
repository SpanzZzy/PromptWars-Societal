import { describe, it, expect } from 'vitest';
import { generateStructuredReport } from '../lib/gemini/analysis';
import { SignalReportSchema, ReportCategory } from '../lib/schemas/report';

describe('Six Required Societal Problem Domains - Workflow Validation', () => {
  const domainTestCases: Array<{
    name: string;
    expectedCategory: ReportCategory;
    input: string;
    expectPrivate: boolean;
  }> = [
    {
      name: '1. Traffic and Road Safety',
      expectedCategory: 'traffic_road_safety',
      input: 'Major car crash and multi-vehicle accident at Kalyani Nagar junction. Both lanes blocked with oil spill.',
      expectPrivate: false,
    },
    {
      name: '2. Civic Infrastructure',
      expectedCategory: 'civic_infrastructure',
      input: 'Live electric wires hanging dangerously low across the pedestrian sidewalk near Shivaji Nagar station.',
      expectPrivate: false,
    },
    {
      name: '3. Weather and Environmental Hazard',
      expectedCategory: 'weather_environment',
      input: 'Severe waterlogging and flooding on Sinhagad Road after continuous heavy monsoon cloudburst.',
      expectPrivate: false,
    },
    {
      name: '4. News & Public Information (Fact-checking)',
      expectedCategory: 'news_public_info',
      input: 'Social media rumor circulating about PMC shutting off all city water supply for 4 days next week.',
      expectPrivate: false,
    },
    {
      name: '5. Photos, Screenshots & Document Intelligence',
      expectedCategory: 'photo_document_verification',
      input: 'Official municipal notice regarding PMC property tax 10% rebate deadline with stamp and signature.',
      expectPrivate: false,
    },
    {
      name: '6. Medical History & Health Records',
      expectedCategory: 'medical_health_records',
      input: 'Doctor prescription and lab report for patient showing fasting blood sugar 160 mg/dL and HbA1c 7.4%.',
      expectPrivate: true,
    },
  ];

  for (const tc of domainTestCases) {
    it(`correctly extracts and structures domain: ${tc.name}`, async () => {
      const { report } = await generateStructuredReport({
        reviewedText: tc.input,
        preferredResponseLanguage: 'en',
        evidenceSummaries: [],
      });

      // Validates against canonical schema
      const parseResult = SignalReportSchema.safeParse(report);
      expect(parseResult.success).toBe(true);

      // Verifies correct category classification
      expect(report.category).toBe(tc.expectedCategory);

      // Verifies honest provenance
      expect(report.verification).toBeDefined();
      expect(report.verification.sourcesChecked).toBeDefined();
      expect(Array.isArray(report.recommendedActions)).toBe(true);
      expect(report.recommendedActions.length).toBeGreaterThan(0);

      // Strict medical privacy enforcement
      if (tc.expectPrivate) {
        expect(report.publicVisibility).toBe('private');
      }
    });
  }
});
