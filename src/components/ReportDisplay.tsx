'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Building,
  ArrowRight,
  HelpCircle,
  Trash2,
  FileCheck,
  CheckSquare,
  Sparkles,
  Loader2,
  FolderClock,
  Camera,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SignalReport } from '@/lib/schemas/report';
import { ProvenanceBadge, UrgencyBadge, StatusBadge } from './Badge';
import { EmergencyBanner } from './EmergencyBanner';

interface ReportDisplayProps {
  report: SignalReport;
  deleteSecret?: string;
  onReset: () => void;
}

export function ReportDisplay({ report, deleteSecret, onReset }: ReportDisplayProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this report? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/reports/${report.id}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteSecret: deleteSecret || report.deleteSecret }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete report');
      }

      setDeletedSuccess(true);
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting report');
    } finally {
      setIsDeleting(false);
    }
  };

  if (deletedSuccess) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Report Successfully Deleted</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Report ID <strong className="font-mono text-slate-700 dark:text-slate-200">{report.id}</strong> and all associated data have been permanently erased from the server.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition"
          >
            Submit Another Report
          </button>
          <Link
            href="/my-reports"
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Go to My Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Emergency if present */}
      {report.isEmergency && (
        <EmergencyBanner advisory={report.emergencyAdvisory} />
      )}

      {/* Main Report Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-5 sm:p-7 border-b border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-sky-300 font-semibold bg-slate-800 px-2.5 py-1 rounded">
                ID: {report.id}
              </span>
              <UrgencyBadge urgency={report.urgency} />
              <StatusBadge status={report.status} />
              {report.isDemoData && (
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-400 text-amber-950 uppercase tracking-wider">
                  DEMO DATA
                </span>
              )}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {report.title}
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            {report.summary}
          </p>
        </div>

        <div className="p-5 sm:p-7 space-y-7">
          {/* Approximate Location & Jurisdictional Entities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Approximate Public Location
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {report.location?.locality || 'Not provided'}
                {report.location?.city ? `, ${report.location.city}` : ''}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                * Coordinates are generalized for privacy protection.
              </p>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Identified Authorities
              </div>
              <div className="flex flex-wrap gap-1.5">
                {report.entities.length > 0 ? (
                  report.entities.map((ent, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      {ent.name}: <span className="font-semibold text-slate-900 dark:text-white">{ent.value}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400">General Municipal Jurisdiction</span>
                )}
              </div>
            </div>
          </div>

          {/* Key Facts by Provenance */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Extracted Facts by Provenance
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {report.facts.length} items
              </span>
            </div>

            <div className="space-y-2.5">
              {report.facts.map((fact) => (
                <div
                  key={fact.id}
                  className="p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm shadow-xs"
                >
                  <div className="text-slate-800 dark:text-slate-200 leading-normal">
                    {fact.statement}
                    {fact.sourceReference && (
                      <span className="block sm:inline sm:ml-2 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        [Ref: {fact.sourceReference}]
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <ProvenanceBadge provenance={fact.provenance} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Action Plan */}
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Recommended Resolution Steps
            </h2>

            <div className="space-y-3">
              {report.recommendedActions.map((action) => (
                <div
                  key={action.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {action.title}
                    </h3>
                    {action.targetEntity && (
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-700 px-2.5 py-0.5 rounded">
                        {action.targetEntity}
                      </span>
                    )}
                  </div>

                  {action.portalOrDesk && (
                    <div className="text-xs text-sky-700 dark:text-sky-400 font-semibold mb-2">
                      Portal / Helpline: {action.portalOrDesk}
                    </div>
                  )}

                  <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-3">
                    {action.steps.map((st, idx) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ol>

                  {action.prerequisites.length > 0 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Prerequisites: </span>
                      {action.prerequisites.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Missing Information / Gaps */}
          {(report.missingInformation.length > 0 || report.contradictions.length > 0) && (
            <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Information Needed to Complete Official Redressal:
              </div>
              {report.missingInformation.length > 0 && (
                <div>
                  <span className="font-semibold">Missing information: </span>
                  {report.missingInformation.join('; ')}
                </div>
              )}
              {report.contradictions.length > 0 && (
                <div>
                  <span className="font-semibold text-red-800 dark:text-red-300">Contradictions noted: </span>
                  {report.contradictions.join('; ')}
                </div>
              )}
            </div>
          )}

          {/* Progressive Disclosure: Technical Verification & Raw Evidence Accordion */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 transition"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Verification Statements & Verbatim Records</span>
              </span>
              {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTechnicalDetails && (
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-600 dark:text-slate-400">
                {/* Verification Statement */}
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">Verification Transparency Statement:</div>
                  <p className="leading-relaxed">{report.verification.verificationNote}</p>
                  {report.verification.sourcesChecked.length > 0 && (
                    <div className="mt-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Sources Checked: </span>
                      {report.verification.sourcesChecked.join(', ')}
                    </div>
                  )}
                  {report.verification.unverifiedClaims.length > 0 && (
                    <div className="mt-1 text-amber-800 dark:text-amber-400">
                      <span className="font-semibold">Unverified Claims: </span>
                      {report.verification.unverifiedClaims.join(', ')}
                    </div>
                  )}
                </div>

                {/* Verbatim Speech Record if present */}
                {report.rawTranscript && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      Original Speech Record:
                    </div>
                    <p className="font-mono italic bg-slate-50 dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                      &quot;{report.rawTranscript}&quot;
                    </p>
                  </div>
                )}

                {/* Multimodal Image Observations if present */}
                {report.imageObservations && report.imageObservations.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      Direct Photographic Observations:
                    </div>
                    <div className="space-y-1.5">
                      {report.imageObservations.map((obs, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                          <strong className="text-slate-800 dark:text-slate-200">{obs.fileName}:</strong> {obs.visibleDetails}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Data Protection & Self-Service Deletion Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Privacy & Data Rights:</span>
              <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                Saved to your personal dossier. You can access this report anytime from &quot;My Reports&quot; or permanently delete it.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-xs font-semibold transition flex-shrink-0 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete My Report</span>
                </>
              )}
            </button>
          </div>
          {deleteError && <p className="text-red-600 dark:text-red-400 text-xs font-semibold">{deleteError}</p>}

          {/* Action Navigation Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              Submit Another Report
            </button>

            <div className="flex items-center gap-2">
              <Link
                href="/my-reports"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
              >
                <FolderClock className="w-4 h-4" />
                <span>My Past Reports</span>
              </Link>
              <Link
                href="/map"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition"
              >
                <MapPin className="w-4 h-4" />
                <span>Live Map</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
