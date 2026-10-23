import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  HelpCircle,
  Mic,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  Camera,
  FolderClock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works — SignalBridge',
  description: 'Understand the SignalBridge architecture, multilingual live transcription, image understanding, trust labels, and verification boundaries.',
};

export default function HowItWorksPage() {
  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-slate-800 dark:text-slate-100 transition-colors">
      <div className="mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 mb-2">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>System Architecture & Standards</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          How SignalBridge Works
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          SignalBridge bridges the gap between raw human expression and structured institutional systems. Whether you record a Marathi voice note about a burst water pipeline, speak live, or submit a photo of an open electricity junction, here is how the pipeline processes and verifies evidence.
        </p>
      </div>

      <div className="space-y-10">
        {/* The 4-Stage Processing Pipeline */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            1. The 4-Stage Reporting Flow
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-100 dark:border-sky-900">
                Stage 1 — Report
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Intuitive Intake</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Type, speak using real-time speech recognition (Marathi, Hindi, or English), upload photographs and documents, or add your current location with one click.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-900">
                Stage 2 — Review
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Transcript & Observation Verification</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Inspect the recognized transcript and image observations before analysis. You can edit names, fix landmarks, and confirm your preferred report language.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-900">
                Stage 3 — Analyze
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Gemini Structured Synthesis</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Server-side Gemini models evaluate the reviewed text and multimodal images against our canonical schema, identifying facts by provenance and generating actionable next steps.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900">
                Stage 4 — Results & History
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Clear Dossier & My Reports</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                View your complete dossier with recommended department contacts and procedural checklists. All your reports are remembered in &quot;My Reports&quot; for easy return visits.
              </p>
            </div>
          </div>
        </section>

        {/* Multimodal Image Understanding */}
        <section className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            Direct Multimodal Image Understanding
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            SignalBridge does not merely read image filenames. Uploaded photographs are transmitted server-side to Gemini to extract visible physical damage (such as pothole dimensions, aggregate wear, water pooling, unshielded wires) and read text on signs or official notices. Visual observations are separated from user statements and independently verified facts.
          </p>
        </section>

        {/* Fact Provenance & Trust Labels */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            2. Fact Provenance & Trust Labels
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Every statement extracted by SignalBridge is categorized into one of four provenance levels:
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  User Reported
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Claims stated directly by the reporting citizen (e.g., &quot;The pothole has been here for three weeks&quot;). Recorded as citizen testimony without independent verification.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                  Extracted from Source
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Information visibly identifiable from an uploaded photograph, PDF document, or audio file (e.g., electricity pole serial code, visible crater depth, letterhead date).
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  Needs Confirmation
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Statements or estimates that require an on-site inspection by a municipal engineer or department officer before they can be certified.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  Independently Verified
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Claims corroborated against official public registers, government tracking portals (e.g. BMC Pothole Tracker, MSEDCL outage logs), or documented field visits.
              </p>
            </div>
          </div>
        </section>

        {/* Emergency Disclaimer */}
        <section className="bg-red-50 dark:bg-red-950/40 p-6 rounded-xl border border-red-200 dark:border-red-900/60 space-y-3">
          <div className="flex items-center gap-2 text-red-900 dark:text-red-300 font-bold text-base">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span>Emergency Protocol & Public Safety Limitations</span>
          </div>
          <p className="text-xs text-red-800 dark:text-red-200 leading-relaxed">
            SignalBridge is an intake and assistance tool, <strong>not an emergency dispatch operator</strong>. If an issue involves immediate danger to human life (severe fire, gas leak, building collapse, or sparking high-voltage wires), please call official emergency helplines immediately:
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-bold text-red-900 dark:text-red-200 pt-1">
            <span className="bg-red-100 dark:bg-red-900/60 px-2.5 py-1 rounded">Police / All Emergencies: 112</span>
            <span className="bg-red-100 dark:bg-red-900/60 px-2.5 py-1 rounded">Fire Service: 101</span>
            <span className="bg-red-100 dark:bg-red-900/60 px-2.5 py-1 rounded">Ambulance: 108 / 102</span>
            <span className="bg-red-100 dark:bg-red-900/60 px-2.5 py-1 rounded">Electricity Hazard Helpline: 1912</span>
          </div>
        </section>

        {/* CTA */}
        <div className="pt-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Try Universal Reporting</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/privacy"
            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline font-medium"
          >
            Review Data & Privacy Practices →
          </Link>
        </div>
      </div>
    </div>
  );
}
