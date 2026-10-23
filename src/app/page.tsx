'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  FileText,
  MapPin,
  Mic,
  AlertTriangle,
  ArrowRight,
  Radio,
  Building,
  Key,
  Car,
  AlertCircle,
  CloudRain,
  HelpCircle,
  FileSearch,
  HeartPulse,
  ChevronRight,
  Layers,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';
import { IntakeForm, IntakeFileItem } from '@/components/IntakeForm';
import { ExtractionReview } from '@/components/ExtractionReview';
import { ReportDisplay } from '@/components/ReportDisplay';
import { BackupKeyModal } from '@/components/BackupKeyModal';
import { ExtractionResponse, SignalReport, ReportCategory } from '@/lib/schemas/report';
import { usePreferences } from '@/components/PreferencesContext';

export default function HomePage() {
  const { t, language } = usePreferences();
  const [step, setStep] = useState<'intake' | 'review' | 'report'>('intake');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Workflow context
  const [extractionResult, setExtractionResult] = useState<ExtractionResponse | null>(null);
  const [finalReport, setFinalReport] = useState<SignalReport | null>(null);
  const [userDeleteSecret, setUserDeleteSecret] = useState<string | undefined>(undefined);
  const [categoryHint, setCategoryHint] = useState<ReportCategory>('traffic_road_safety');
  const [locationHint, setLocationHint] = useState<string | undefined>(undefined);
  const [preferredLanguage, setPreferredLanguage] = useState<string>('en');

  // Synchronize preferredLanguage with chosen global language
  useEffect(() => {
    if (language) {
      setPreferredLanguage(language);
    }
  }, [language]);

  // In-memory transient backup key (NEVER persisted to disk or storage)
  const [backupApiKey, setBackupApiKey] = useState<string | undefined>(undefined);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupModalReason, setBackupModalReason] = useState<string | undefined>(undefined);

  const reportSectionRef = useRef<HTMLDivElement | null>(null);

  const scrollToReportEngine = (category?: ReportCategory) => {
    if (category) {
      setCategoryHint(category);
    }
    if (step !== 'intake') {
      setStep('intake');
    }
    reportSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Stage A: Submit Intake for Multilingual Extraction & Transcription
  const handleIntakeSubmit = async (data: {
    text: string;
    mediaFiles: IntakeFileItem[];
    categoryHint?: ReportCategory;
    locationHint?: string;
    preferredLanguage: string;
    rawTranscript?: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    if (data.categoryHint) setCategoryHint(data.categoryHint);
    setLocationHint(data.locationHint);
    setPreferredLanguage(data.preferredLanguage);

    try {
      const payload = {
        text: data.text,
        mediaFiles: data.mediaFiles.map((m) => ({
          name: m.name,
          type: m.type,
          base64Data: m.base64Data,
          size: m.size,
        })),
        preferredLanguage: data.preferredLanguage,
        userBackupApiKey: backupApiKey,
      };

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        if (resData.eligibleForBackupKey) {
          setBackupModalReason(resData.error || 'Server Gemini key unavailable or rate limited.');
          setIsBackupModalOpen(true);
        }
        throw new Error(resData.error || 'Extraction failed');
      }

      setExtractionResult(resData);
      setStep('review');
      reportSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing multimodal input.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stage B: Execute Gemini Structured Analysis
  const handleProceedToAnalyze = async (data: {
    reviewedText: string;
    rawTranscript?: string;
    preferredLanguage: string;
    categoryHint?: ReportCategory;
    locationHint?: string;
    imageObservations: any[];
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        reviewedText: data.reviewedText,
        rawTranscript: data.rawTranscript || extractionResult?.originalTranscript,
        categoryHint: data.categoryHint || categoryHint,
        locationHint: data.locationHint || locationHint,
        preferredResponseLanguage: data.preferredLanguage,
        evidenceSummaries: extractionResult?.processedFiles.map((f) => ({
          name: f.name,
          type: f.type as any,
          snippet: f.summary,
        })) || [],
        imageObservations: data.imageObservations || extractionResult?.imageObservations || [],
        userBackupApiKey: backupApiKey,
      };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        if (resData.eligibleForBackupKey) {
          setBackupModalReason(resData.error || 'Gemini API key error during structured analysis.');
          setIsBackupModalOpen(true);
        }
        throw new Error(resData.error || 'Structured analysis failed');
      }

      setFinalReport(resData.report);
      setUserDeleteSecret(resData.deleteSecret);
      setStep('report');
      reportSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating structured report.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetWorkflow = () => {
    setStep('intake');
    setExtractionResult(null);
    setFinalReport(null);
    setErrorMessage(null);
    reportSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const categoriesList = [
    {
      id: 'traffic_road_safety' as ReportCategory,
      title: t.catTraffic || 'Traffic & Road Safety',
      desc: t.catTrafficDesc || 'Car accidents, highway blockages, traffic signal outages, dangerous intersections (Pilot: Kalyani Nagar).',
      icon: Car,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
      badge: 'Emergency Response',
    },
    {
      id: 'civic_infrastructure' as ReportCategory,
      title: t.catInfra || 'Civic Infrastructure & Utilities',
      desc: t.catInfraDesc || 'Deep road potholes, sparking live wires, overflowing storm drains, water pipeline breaches across municipalities.',
      icon: Building,
      color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800',
      badge: 'Municipal / DISCOM',
    },
    {
      id: 'weather_environment' as ReportCategory,
      title: t.catWeather || 'Weather & Disaster Alerts',
      desc: t.catWeatherDesc || 'Monsoon water-logging, flooded underpasses, uprooted fallen trees, cyclone & storm hazards.',
      icon: CloudRain,
      color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800',
      badge: 'Disaster Cells',
    },
    {
      id: 'news_public_info' as ReportCategory,
      title: t.catNews || 'News & Fact-Check',
      desc: t.catNewsDesc || 'Verify civic rumors, municipal advisories, water cut notifications, local public safety circulars across cities.',
      icon: HelpCircle,
      color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800',
      badge: 'Public Fact-Check',
    },
    {
      id: 'photo_document_verification' as ReportCategory,
      title: t.catDocs || 'Photos & Document OCR',
      desc: t.catDocsDesc || 'Scan official notices, municipal stamps, government letters, certificates, and multi-script signboard text.',
      icon: FileSearch,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
      badge: 'Multimodal OCR',
    },
    {
      id: 'medical_health_records' as ReportCategory,
      title: t.catHealth || 'Medical & Health Records',
      desc: t.catHealthDesc || 'Private emergency health records, lab reports, doctor prescriptions, discharge summaries.',
      icon: HeartPulse,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
      badge: 'Private & Encrypted',
    },
  ];

  return (
    <div className="flex-1 w-full pb-16">
      {/* 1. Active Civic Emergency Alert Banner */}
      <aside aria-label="Emergency civic alert" className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <span className="font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-[11px]">{t.alertPilotTitle || 'ACTIVE CIVIC ALERT • PUNE PILOT:'}</span>
            <span>{t.alertPilotDesc || 'Multi-vehicle collision & road blockage on Kalyani Nagar Main Road (Metro Pillar 142). Emergency dispatch notified.'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/map"
              className="font-bold underline hover:text-amber-100 flex items-center gap-1 text-xs"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{t.viewCommunityMap || 'View on Community Map'}</span>
            </Link>
            <button
              onClick={() => scrollToReportEngine('traffic_road_safety')}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded font-semibold text-xs transition"
            >
              {t.reportDetails || 'Report Details'}
            </button>
          </div>
        </div>
      </aside>

      {/* Backup Key Status Indicator if active */}
      {backupApiKey && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200 px-3.5 py-2 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Using in-memory personal Gemini API key for this active browser session.</span>
            </div>
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="underline font-semibold hover:text-sky-950 dark:hover:text-white"
            >
              Manage Key
            </button>
          </div>
        </div>
      )}

      {/* 2. Modern Civic Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 bg-gradient-to-b from-sky-50/60 via-slate-50 to-white dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 mb-4 shadow-2xs">
            <Radio className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-pulse" />
            <span>{t.heroBadge || 'National Civic Intelligence & Incident Dispatch Network • Pan-India Architecture (Live Pilot: Pune)'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl">
            {t.heroTitle || 'Universal Bridge Between Human Intent & Real-World Civic Systems Across India'}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            {t.heroSubtitle || 'Empowering citizens across Indian cities, districts, and municipalities to report traffic blockages, road accidents, civic infrastructure hazards, official notices, or emergency inquiries. Speak live in any of the 22 Scheduled Indian Languages, upload photos, or submit documents to generate evidence-aware, actionable dossiers.'}
          </p>

          {/* Quick Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => scrollToReportEngine()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.reportNowCta || 'Report an Incident Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-sm rounded-xl shadow-xs transition"
            >
              <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>{t.exploreMapCta || 'Explore Live Community Map'}</span>
            </Link>

            <Link
              href="/my-reports"
              className="inline-flex items-center gap-2 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium text-sm transition"
            >
              <span>{t.trackPastReportsCta || 'Track Past Reports →'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. The 6 Problem Domains Grid */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">
              Select Your Civic Domain
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.categoriesHeading || '6 Real-World Problem Categories'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t.categoriesSubheading || 'Click any category below to pre-select it and launch the guided reporting engine.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesList.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => scrollToReportEngine(cat.id)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl border ${cat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {cat.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition flex items-center justify-between">
                    <span>{idx + 1}. {cat.title}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-sky-600 dark:text-sky-400 font-semibold">
                  <span>{t.reportCategoryLink || 'Report in this category'}</span>
                  <span className="text-slate-300 dark:text-slate-600">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. The 4-Stage Civic Workflow Explainer */}
      <section className="py-10 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
              <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <span>{t.workflowHeading || 'How SignalBridge Bridges Intent to Reality'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t.workflowSubheading || 'A 4-step evidence-aware workflow connecting citizen voice to municipal corporations, DISCOMs, and emergency dispatch systems across India.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center mb-2.5">
                01
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{t.step1Title || 'Multimodal Intake'}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t.step1Desc || 'Speak live in any of 22 Scheduled Indian languages (Hindi, Marathi, Tamil, etc.), upload site photos, audio notes, or PDF notices.'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center mb-2.5">
                02
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{t.step2Title || 'Citizen Verification'}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t.step2Desc || 'Review and edit recognized text, visual damage observations, and automated translations before final submission.'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center mb-2.5">
                03
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{t.step3Title || 'Gemini Synthesis'}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t.step3Desc || 'Gemini structures facts by provenance, evaluates severity, and maps administrative jurisdiction across urban and rural bodies.'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center mb-2.5">
                04
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{t.step4Title || 'Actionable Dispatch'}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t.step4Desc || 'Pinned to Live Map with designated emergency helpline contacts and a permanent cryptographic deletion secret.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Reporting Engine Section */}
      <section ref={reportSectionRef} id="report-section" className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              {t.interactiveEngineHeading || 'Interactive Civic Engine'}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.reportIssueHeading || 'Report an Issue or Public Service Inquiry'}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2.5 py-1 rounded-full font-medium ${step === 'intake' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              {t.stepIntake || '1. Intake'}
            </span>
            <span className="text-slate-300">→</span>
            <span className={`px-2.5 py-1 rounded-full font-medium ${step === 'review' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              {t.stepReview || '2. Review'}
            </span>
            <span className="text-slate-300">→</span>
            <span className={`px-2.5 py-1 rounded-full font-medium ${step === 'report' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              {t.stepOutcome || '3. Outcome'}
            </span>
          </div>
        </div>

        <main className="transition-all duration-200">
          {step === 'intake' && (
            <IntakeForm
              onSubmitForExtraction={handleIntakeSubmit}
              isLoading={isLoading}
              error={errorMessage}
              onOpenBackupKeyModal={() => setIsBackupModalOpen(true)}
              hasBackupKey={Boolean(backupApiKey)}
              initialCategory={categoryHint}
            />
          )}

          {step === 'review' && extractionResult && (
            <ExtractionReview
              extraction={extractionResult}
              categoryHint={categoryHint}
              locationHint={locationHint}
              preferredLanguage={preferredLanguage}
              onProceedToAnalyze={handleProceedToAnalyze}
              onBack={() => setStep('intake')}
              isLoading={isLoading}
              error={errorMessage}
              onOpenBackupKeyModal={() => setIsBackupModalOpen(true)}
            />
          )}

          {step === 'report' && finalReport && (
            <ReportDisplay
              report={finalReport}
              deleteSecret={userDeleteSecret}
              onReset={handleResetWorkflow}
            />
          )}
        </main>
      </section>

      {/* 6. Emergency Contacts & National Coverage */}
      <section className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 mb-1">
                Pan-India Emergency Response
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <span>{t.emergencyHelplineHeading || 'National Emergency Helplines & Municipal Dispatch Directory'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.emergencyHelplineSubtitle || 'For active life-threatening emergencies anywhere in India, contact official national and local emergency operators directly:'}
              </p>
            </div>
            <Link
              href="/map"
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>{t.viewCommunityMap || 'View Community Map'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-slate-400 text-[10px] font-bold uppercase">{t.allEmergencies || 'All Emergencies (India)'}</div>
              <div className="font-bold text-base text-slate-900 dark:text-white mt-0.5">112</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{t.nationalErss || 'National ERSS (Police, Highway)'}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-slate-400 text-[10px] font-bold uppercase">{t.medicalAmbulance || 'Medical & Ambulance'}</div>
              <div className="font-bold text-base text-slate-900 dark:text-white mt-0.5">108 / 102</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{t.ambulanceHospital || 'National Emergency Ambulance'}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-slate-400 text-[10px] font-bold uppercase">{t.fireDisaster || 'Fire & Disaster'}</div>
              <div className="font-bold text-base text-slate-900 dark:text-white mt-0.5">101 / 1070</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{t.fireBrigade || 'Fire Brigade & NDMA Disaster Cell'}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-slate-400 text-[10px] font-bold uppercase">{t.electricalHazards || 'Electrical Hazards'}</div>
              <div className="font-bold text-base text-slate-900 dark:text-white mt-0.5">1912</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{t.electricityHelpline || 'All-India Electricity Helpline'}</div>
            </div>
          </div>

          {/* Pilot Context Note */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              <strong>Live Pilot Demonstration:</strong> Pune Metropolitan Region (PMC / Yerwada / Kalyani Nagar) currently showcases real-time civic telemetry and local municipal integration.
            </span>
            <span className="text-slate-400 dark:text-slate-500 sm:text-right">
              {t.pilotDemoNote || 'Architecture designed for nationwide deployment across all Indian Smart Cities & Panchayats.'}
            </span>
          </div>
        </div>
      </section>

      {/* Backup Key Modal */}
      <BackupKeyModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onSaveKey={(key) => setBackupApiKey(key)}
        onClearKey={() => setBackupApiKey(undefined)}
        currentKey={backupApiKey}
        failureReason={backupModalReason}
      />
    </div>
  );
}
