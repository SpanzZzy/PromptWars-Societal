import { describe, it, expect } from 'vitest';
import { isEligibleForBackupKey, getGeminiClient } from '../lib/gemini/client';
import { extractAndTranscribe } from '../lib/gemini/extraction';
import { generateStructuredReport } from '../lib/gemini/analysis';
import { SignalReportSchema } from '../lib/schemas/report';

describe('Gemini Pipeline & Multilingual Evaluation Dataset', () => {
  describe('Backup Key Eligibility Detection', () => {
    it('returns true for missing key, invalid key, or quota exhausted errors', () => {
      expect(isEligibleForBackupKey(new Error('API_KEY_INVALID: API key not valid.'))).toBe(true);
      expect(isEligibleForBackupKey(new Error('Resource has been exhausted (e.g. check quota 429).'))).toBe(true);
      expect(isEligibleForBackupKey(new Error('No server GEMINI_API_KEY configured and no backup key provided.'))).toBe(true);
      expect(isEligibleForBackupKey(new Error('PERMISSION_DENIED'))).toBe(true);
    });

    it('returns false for unrelated errors like network timeout or disk errors', () => {
      expect(isEligibleForBackupKey(new Error('ETIMEDOUT: Connection timed out'))).toBe(false);
      expect(isEligibleForBackupKey(new Error('Unexpected token < in JSON at position 0'))).toBe(false);
      expect(isEligibleForBackupKey(null)).toBe(false);
    });
  });

  describe('Repeatable Evaluation Dataset (Three Workflows)', () => {
    // Dataset Case 1: Multilingual Marathi / Hindi Voice Note (Civic Safety)
    it('evaluates Multilingual Marathi voice report (Shivaji Nagar live wires)', async () => {
      const extraction = await extractAndTranscribe({
        text: 'शिवाजी नगर बस स्थानकाजवळ विजेच्या उघड्या तारा आहेत. पावसात शॉक लागण्याची भीती आहे. (Near Shivaji Nagar bus stand, open electric wires are exposed. High risk of shock.)',
        preferredLanguage: 'mr',
        mediaFiles: [
          {
            name: 'voice_note_marathi.webm',
            type: 'audio/webm',
            base64Data: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8tGAE88g==',
            size: 2048,
          },
        ],
      });

      expect(extraction.success).toBe(true);
      expect(extraction.detectedLanguage).toBe('mr');
      expect(extraction.isEmergencyAlert).toBe(true);
      expect(extraction.extractedText).toContain('शिवाजी नगर');

      // Run Stage B Structured Analysis
      const { report, isDemoMode } = await generateStructuredReport({
        reviewedText: extraction.extractedText,
        categoryHint: 'civic_infrastructure',
        locationHint: 'Shivaji Nagar Bus Stand, Pune',
        preferredResponseLanguage: 'en',
        evidenceSummaries: extraction.processedFiles.map((f) => ({
          name: f.name,
          type: f.type as any,
          snippet: f.summary,
        })),
      });

      expect(SignalReportSchema.safeParse(report).success).toBe(true);
      expect(report.category).toBe('civic_infrastructure');
      expect(report.urgency).toBe('critical');
      expect(report.isEmergency).toBe(true);
      expect(report.emergencyAdvisory).toBeDefined();

      // Check provenance separation
      expect(report.facts.length).toBeGreaterThan(0);
      report.facts.forEach((f) => {
        expect(['user_reported', 'extracted_from_source', 'independently_verified', 'needs_confirmation']).toContain(f.provenance);
      });

      // Actions must contain emergency helpline
      expect(report.recommendedActions.length).toBeGreaterThan(0);
      expect(report.recommendedActions[0].portalOrDesk).toContain('112');
    });

    // Dataset Case 2: Hindi Traffic & Road Safety (Pothole & Road Hazard on Nagar Road, Pune)
    it('evaluates Hindi civic road infrastructure report in Pune', async () => {
      const extraction = await extractAndTranscribe({
        text: 'कल्याणी नगर मुख्य रस्त्यावर आणि नगर रोड चौकात मोठा खड्डा पडला आहे, वाहने घसरत आहेत.',
        preferredLanguage: 'hi',
        mediaFiles: [
          {
            name: 'pothole_photo.jpg',
            type: 'image/jpeg',
            base64Data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD==',
            size: 4096,
          },
        ],
      });

      expect(extraction.success).toBe(true);

      const { report } = await generateStructuredReport({
        reviewedText: extraction.extractedText,
        categoryHint: 'traffic_road_safety',
        locationHint: 'Kalyani Nagar / Nagar Road, Pune',
        preferredResponseLanguage: 'en',
        evidenceSummaries: [{ name: 'pothole_photo.jpg', type: 'image', snippet: 'Photo of road pothole' }],
      });

      expect(SignalReportSchema.safeParse(report).success).toBe(true);
      expect(['traffic_road_safety', 'civic_infrastructure']).toContain(report.category);
      expect(report.recommendedActions[0].steps.length).toBeGreaterThan(0);
    });

    // Dataset Case 3: English Document & Public Service Assistance (Pension in Pune GPO)
    it('evaluates English Document / Public Service Assistance report in Pune', async () => {
      const extraction = await extractAndTranscribe({
        text: 'Senior citizen pension withheld due to biometric fingerprint failure at Pune General Post Office counter during annual life certificate submission.',
        preferredLanguage: 'en',
        mediaFiles: [
          {
            name: 'ppo_letter.pdf',
            type: 'application/pdf',
            base64Data: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDw...',
            size: 8192,
          },
        ],
      });

      expect(extraction.success).toBe(true);
      expect(extraction.detectedLanguage).toBe('en');

      const { report } = await generateStructuredReport({
        reviewedText: extraction.extractedText,
        categoryHint: 'document_public_service',
        locationHint: 'Sadhu Vaswani Road, Pune GPO, Pune',
        preferredResponseLanguage: 'en',
        evidenceSummaries: [{ name: 'ppo_letter.pdf', type: 'document', snippet: 'PPO copy' }],
      });

      expect(SignalReportSchema.safeParse(report).success).toBe(true);
      expect(report.category).toBe('document_public_service');
      expect(report.isEmergency).toBe(false);

      // Verify actions provide document and portal guidance
      const actionTitles = report.recommendedActions.map((a) => a.title).join(' ');
      expect(actionTitles.toLowerCase()).toMatch(/portal|document|verification/);
    });
  });
});
