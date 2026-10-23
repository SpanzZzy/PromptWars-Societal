import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, ShieldAlert, FileText, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Use & Disclaimers — SignalBridge',
  description: 'Terms of Use, AI limitations, emergency protocols, and third-party service policies for SignalBridge.',
};

export default function TermsPage() {
  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-slate-800 dark:text-slate-100 transition-colors">
      <div className="mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mb-2">
          <FileText className="w-3.5 h-3.5" />
          <span>Terms & Conditions</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Terms of Use & Disclaimers
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          Please read these terms carefully before utilizing the SignalBridge civic reporting system.
        </p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {/* 1. Nature of the Service */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. Nature of the Service & Scope
          </h2>
          <p>
            SignalBridge is a public civic technology platform designed to bridge human communication and real-world civic systems. The software demonstrates how multimodal AI (Google Gemini) can assist citizens in translating, extracting, and structuring unstructured reports across Marathi, Hindi, and English.
          </p>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <strong>Important:</strong> SignalBridge is not an official government department, municipal corporation, or emergency services dispatch operator. Submitting a report on SignalBridge creates a structured civic dossier for citizen follow-up; it does not guarantee that a municipal authority has taken immediate real-world action.
          </div>
        </section>

        {/* 2. AI Limitations & Verification */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. AI Guidance & Verification Limitations
          </h2>
          <p>
            SignalBridge employs Google Gemini models for multilingual transcription and report synthesis:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li>
              <strong>No Automated Proof:</strong> AI outputs are advisory and exploratory. An AI-generated confidence score or structured summary is never treated as legal or factual proof.
            </li>
            <li>
              <strong>Medical & Legal Disclaimer:</strong> SignalBridge does not provide medical diagnosis, treatment recommendations, or formal legal counsel.
            </li>
            <li>
              <strong>Ground Verification:</strong> Reports published to the community map represent citizen observations; independent verification requires formal government inspection.
            </li>
          </ul>
        </section>

        {/* 3. Emergency Situations */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Life-Threatening Emergencies
          </h2>
          <p>
            Never use SignalBridge as a substitute for emergency services. For active structural collapse, gas leaks, sparking live high-voltage cables, or imminent threats to human life, call national helplines directly:
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded">Police / All Emergencies: 112</span>
            <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded">Fire Brigade: 101</span>
            <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded">Ambulance: 108 / 102</span>
            <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded">MSEDCL Electricity Emergency: 1912</span>
          </div>
        </section>

        {/* 4. Responsible Use */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. User Responsibilities
          </h2>
          <p>
            Users agree to use SignalBridge responsibly:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs sm:text-sm">
            <li>Do not upload malicious, defamatory, obscene, or infringing materials.</li>
            <li>Do not submit personal identification documents (Aadhaar, PAN, passports) belonging to other individuals without legal authorization.</li>
            <li>Do not attempt prompt injection attacks or attempts to breach server security.</li>
          </ul>
        </section>

        {/* 5. Third-Party Integrations */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Third-Party Service Terms
          </h2>
          <p>
            SignalBridge interacts with external services:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs sm:text-sm">
            <li>
              <strong>Google Gemini API:</strong> Governed by the{' '}
              <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 underline font-medium">
                Google APIs Terms of Service
              </a>
              . Users supplying an optional personal API key are responsible for their key usage and associated quotas.
            </li>
            <li>
              <strong>OpenStreetMap:</strong> Map tiles are provided by OpenStreetMap contributors under the Open Data Commons Open Database License (ODbL).
            </li>
          </ul>
        </section>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <Link href="/privacy" className="text-sky-600 dark:text-sky-400 underline font-semibold hover:text-sky-800 dark:hover:text-sky-300">
            Review Privacy Policy →
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
