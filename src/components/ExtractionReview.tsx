'use client';

import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  Edit3,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Globe,
  Sparkles,
  Camera,
  Languages,
} from 'lucide-react';
import { ExtractionResponse, ReportCategory, ImageObservation } from '@/lib/schemas/report';
import { EmergencyBanner } from './EmergencyBanner';
import { SCHEDULED_INDIAN_LANGUAGES } from '@/lib/i18n/languages';

interface ExtractionReviewProps {
  extraction: ExtractionResponse;
  categoryHint?: ReportCategory;
  locationHint?: string;
  preferredLanguage: string;
  onProceedToAnalyze: (reviewedData: {
    reviewedText: string;
    rawTranscript?: string;
    preferredLanguage: string;
    categoryHint?: ReportCategory;
    locationHint?: string;
    imageObservations: ImageObservation[];
  }) => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string | null;
  onOpenBackupKeyModal?: () => void;
}

export function ExtractionReview({
  extraction,
  categoryHint,
  locationHint,
  preferredLanguage: initialLanguage,
  onProceedToAnalyze,
  onBack,
  isLoading,
  error,
  onOpenBackupKeyModal,
}: ExtractionReviewProps) {
  const [reviewedText, setReviewedText] = useState(extraction.extractedText);
  const [preferredLanguage, setPreferredLanguage] = useState<string>(initialLanguage);
  const [category, setCategory] = useState<ReportCategory | undefined>(categoryHint);
  const [location, setLocation] = useState(locationHint || '');
  const [imageObservations, setImageObservations] = useState<ImageObservation[]>(
    extraction.imageObservations || []
  );

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewedText.trim()) return;

    onProceedToAnalyze({
      reviewedText: reviewedText.trim(),
      rawTranscript: extraction.originalTranscript,
      preferredLanguage,
      categoryHint: category,
      locationHint: location.trim() || undefined,
      imageObservations,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-7 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Stage 2 of 4 — Review & Verify
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-0.5">
            <span>Human-in-the-Loop Verification</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Verify the recognized transcript and image observations below. Make any needed corrections before Gemini analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            Detected: {extraction.detectedLanguageName}
          </span>
          {extraction.isDemoMode && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Local Demo Simulator
            </span>
          )}
        </div>
      </div>

      {/* Emergency Alert if triggered */}
      {extraction.isEmergencyAlert && (
        <EmergencyBanner advisory="High-risk hazard detected in submission (sparking wiring, structural danger, or gas leak). Bystanders must maintain a safe perimeter." />
      )}

      {/* Warnings & Transparency Notices */}
      {extraction.warnings.length > 0 && (
        <div className="mb-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Extraction Transparency Notice:
          </div>
          <ul className="list-disc list-inside space-y-0.5">
            {extraction.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleProceed} className="space-y-6">
        {/* Section 1: Verbatim Speech Record (Original Language) */}
        {extraction.originalTranscript && (
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Verbatim Spoken Record (Original Language)</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              &quot;{extraction.originalTranscript}&quot;
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              * Exact speaker words preserved in original script without automated paraphrasing.
            </p>
          </div>
        )}

        {/* Section 2: Optional Translation (Distinct from original transcript) */}
        {extraction.translatedText && (
          <div className="bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-4">
            <div className="text-xs font-bold text-sky-900 dark:text-sky-200 mb-1 flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>AI English Translation (For Reference)</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-sky-100 dark:border-sky-900/60">
              {extraction.translatedText}
            </p>
          </div>
        )}

        {/* Section 3: Multimodal Image Observations */}
        {extraction.imageObservations && extraction.imageObservations.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Multimodal Visual Observations from Attached Photographs ({extraction.imageObservations.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {extraction.imageObservations.map((obs, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{obs.fileName}</div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{obs.visibleDetails}</p>
                  {obs.extractedText && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                      <strong>Text on Sign/Notice:</strong> {obs.extractedText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Editable Reviewed Text for Gemini Analysis */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="reviewed-textarea" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              Reviewed Description (Editable for Corrections)
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Correct any landmarks, street names, or details below
            </span>
          </div>

          <textarea
            id="reviewed-textarea"
            rows={5}
            value={reviewedText}
            onChange={(e) => setReviewedText(e.target.value)}
            className="w-full text-sm font-sans border border-slate-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 leading-relaxed"
            required
          />
        </div>

        {/* Metadata Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Confirmed Category
            </label>
            <select
              value={category || 'civic_infrastructure'}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="traffic_road_safety">1. Traffic & Road Safety</option>
              <option value="civic_infrastructure">2. Civic Infrastructure & Safety</option>
              <option value="weather_environment">3. Weather & Environmental Hazard</option>
              <option value="news_public_info">4. News & Fact-Check Verification</option>
              <option value="photo_document_verification">5. Photos & Document Intelligence</option>
              <option value="medical_health_records">6. Medical History & Health Records</option>
              <option value="document_public_service">Public Service Assistance</option>
              <option value="other">Other Community Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-sky-600 dark:text-sky-400" /> Final Report Language
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {SCHEDULED_INDIAN_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Confirmed Landmark / Locality
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kalyani Nagar, Pune • MG Road, Bengaluru • Connaught Place, Delhi"
              className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 p-3 rounded-lg text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
              {onOpenBackupKeyModal && (
                <button
                  type="button"
                  onClick={onOpenBackupKeyModal}
                  className="mt-1 font-bold text-sky-700 dark:text-sky-400 underline block"
                >
                  Configure Optional Personal Gemini API Key
                </button>
              )}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Intake</span>
          </button>

          <button
            type="submit"
            disabled={isLoading || !reviewedText.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Gemini Analysis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze with Gemini & Generate Action Plan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
