import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, Eye, Trash2, Key, CheckCircle2, Server, FolderClock, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Handling — SignalBridge',
  description: 'Detailed, plain-language privacy policy explaining data intake, server-side Gemini transmission, location approximation, guest identity, and self-service data deletion.',
};

export default function PrivacyPage() {
  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-slate-800 dark:text-slate-100 transition-colors">
      <div className="mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>Transparent Data Governance</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Privacy Policy & Data Handling
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          Last Updated: October 2026. This policy describes how SignalBridge collects, processes, and protects your information as a public civic-technology platform.
        </p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {/* 1. What Information We Process */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400" />
            1. Information You Provide & Supported Files
          </h2>
          <p>
            When submitting a report or inquiry to SignalBridge, you may provide:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li><strong>Typed or Pasted Text:</strong> Problem descriptions, civic notices, or landmark details.</li>
            <li><strong>Voice & Speech:</strong> Real-time browser speech recognition (typed directly into your browser) or recorded voice notes (MP3, WAV, WebM, M4A) in Marathi, Hindi, English, or mixed speech.</li>
            <li><strong>Photographic Evidence:</strong> Images and screenshots of road hazards, utility damage, or public posters (JPEG, PNG, WebP). Actual visual contents are analyzed to identify visible damage and read signs.</li>
            <li><strong>Documents:</strong> PDFs and text files containing public service paperwork or formal notices.</li>
            <li><strong>Optional Location:</strong> If you explicitly select &quot;Use My Current Location&quot;, your browser coordinates are captured on-demand to identify the relevant municipal ward or locality.</li>
          </ul>
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            * Medical and highly confidential personal identification documents (unredacted Aadhaar, PAN, passwords) should not be submitted.
          </p>
        </section>

        {/* 2. Returning Users & Guest Identity */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400" />
            2. Returning Users, Report History & Achievements
          </h2>
          <p>
            SignalBridge allows citizens to submit reports and revisit them without creating a traditional password-based account:
          </p>
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FolderClock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Persistent Guest Session Cookie (`sb_user_id`)
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              When you first visit SignalBridge, our server creates a secure, random guest identifier stored in an HTTP-only cookie. Your submitted reports and unlocked contribution milestones are associated with this identifier.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 pt-1">
              <li><strong>My Reports:</strong> Lets you revisit your past reports across browser reloads to view transcripts, recommended steps, and administrative status updates.</li>
              <li><strong>Ownership Protection:</strong> Only you (via your guest cookie) or an authorized administrator can view your private reports or delete them. Other users cannot access your private records.</li>
              <li><strong>Milestones:</strong> Lightweight contribution badges are calculated strictly from your verified submissions.</li>
            </ul>
          </div>
        </section>

        {/* 3. Processing with Gemini & AI Transmission */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400" />
            3. Server-Side Processing with Google Gemini
          </h2>
          <p>
            SignalBridge employs server-side calls to Google&apos;s official Gemini API to transcribe speech, analyze image contents, and formulate structured civic reports.
          </p>
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-slate-900 dark:text-white">Credential Handling:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
              <li>
                <strong>Default Mode:</strong> Requests are processed server-side using the project&apos;s configured server environment key (`GEMINI_API_KEY`). Citizens are never required to provide their own key.
              </li>
              <li>
                <strong>Optional User-Provided Backup Key:</strong> If the default key is rate-limited or unconfigured, users may optionally supply their personal Gemini key. The key is kept strictly in client-side memory for that session, transmitted over HTTPS only for that authorized call, and never saved in cookies, storage, databases, or logs.
              </li>
            </ul>
          </div>
        </section>

        {/* 4. Public Map & Location Approximation */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400" />
            4. Public Map Visibility & Location Privacy
          </h2>
          <p>
            To protect individual safety, SignalBridge enforces strict privacy safeguards on the Live Community Map:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs sm:text-sm">
            <li>Only reports explicitly approved by an administrator become visible on the public map.</li>
            <li>Exact residential addresses and high-precision GPS coordinates are <strong>never</strong> displayed. All public markers use generalized locality or street-level approximations.</li>
            <li>Private documents, full verbatim audio recordings, and internal moderation notes remain hidden from public view.</li>
          </ul>
        </section>

        {/* 5. Data Storage & Self-Service Deletion */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400" />
            5. Data Retention & Right to Erasure (Self-Service Deletion)
          </h2>
          <p>
            SignalBridge maintains a real data deletion workflow. When a report is generated, a unique, cryptographically random <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs text-sky-700 dark:text-sky-300 font-mono">deleteSecret</code> is issued to your client.
          </p>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs space-y-2 text-emerald-950 dark:text-emerald-200">
            <div className="font-bold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Real Deletion Endpoint (`/api/reports/[id]/delete`)
            </div>
            <p>
              You can permanently delete your report at any time directly from the report view or My Reports using the &quot;Delete My Report&quot; button. This immediately purges the record from both server memory and the persistent storage file.
            </p>
          </div>
        </section>

        {/* 6. Third-Party Disclosures */}
        <section className="bg-slate-100 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 dark:text-white">Third-Party Terms & Disclosures</h3>
          <p className="text-slate-600 dark:text-slate-400">
            SignalBridge interacts with external services governed by their respective policies:
            Please review the{' '}
            <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 underline font-medium">
              Google Gemini API Terms of Service
            </a>{' '}
            and the{' '}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 underline font-medium">
              OpenStreetMap Foundation Tile Policy
            </a>
            .
          </p>
        </section>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <Link href="/terms" className="text-sky-600 dark:text-sky-400 underline font-semibold hover:text-sky-800 dark:hover:text-sky-300">
            Read Terms of Use →
          </Link>
          <Link href="/" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            Back to Report Intake
          </Link>
        </div>
      </div>
    </div>
  );
}
