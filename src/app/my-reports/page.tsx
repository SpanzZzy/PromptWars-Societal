'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderClock,
  Sparkles,
  Calendar,
  MapPin,
  Trash2,
  ExternalLink,
  Award,
  Trophy,
  ShieldCheck,
  Radio,
  PlusCircle,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { SignalReport, UserAchievements } from '@/lib/schemas/report';
import { UrgencyBadge, StatusBadge } from '@/components/Badge';

export default function MyReportsPage() {
  const [reports, setReports] = useState<SignalReport[]>([]);
  const [achievements, setAchievements] = useState<UserAchievements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<SignalReport | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMyReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/my-reports');
      if (!res.ok) throw new Error('Failed to retrieve your report history.');
      const data = await res.json();
      setReports(data.reports || []);
      setAchievements(data.achievements || null);
    } catch (err: any) {
      setError(err.message || 'Could not load your reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  const handleDelete = async (id: string, deleteSecret?: string) => {
    if (!confirm('Are you sure you want to permanently delete this report?')) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/reports/${id}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteSecret }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }

      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
      fetchMyReports();
    } catch (err: any) {
      alert(`Deletion error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'Radio':
        return <Radio className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Award':
        return <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'Trophy':
      default:
        return <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    }
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-slate-800 dark:text-slate-100 transition-colors">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400 mb-1">
            <FolderClock className="w-4 h-4" />
            <span>Citizen Dossier</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Past Reports & Achievements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review your previously submitted issues, track status updates, and view your civic contributions.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Report</span>
        </Link>
      </div>

      {/* Lightweight Achievement Milestones */}
      {achievements && (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Civic Participation Milestones</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Recognizing meaningful community submissions ({achievements.totalSubmissions} valid reports submitted).
              </p>
            </div>

            {achievements.nextMilestone && (
              <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                Next: <strong className="text-slate-800 dark:text-white">{achievements.nextMilestone.title}</strong>{' '}
                ({achievements.totalSubmissions} / {achievements.nextMilestone.requiredCount})
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {achievements.achievements.map((tier) => (
              <div
                key={tier.id}
                className={`p-3.5 rounded-xl border transition ${
                  tier.unlocked
                    ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      tier.unlocked ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {getAchievementIcon(tier.icon)}
                  </div>
                  {tier.unlocked ? (
                    <span className="text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {tier.requiredCount} reports
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">{tier.title}</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{tier.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reports List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
          <span>Retrieving your report history...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <FolderClock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">No reports recorded yet</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
            When you submit a civic issue or document inquiry, it will be remembered here so you can review status updates anytime.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Your First Report</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Your Reports ({reports.length})
          </div>

          <div className="grid grid-cols-1 gap-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded font-semibold border border-sky-100 dark:border-sky-800">
                      {rep.id}
                    </span>
                    <UrgencyBadge urgency={rep.urgency} />
                    <StatusBadge status={rep.status} />
                  </div>

                  <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">{rep.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{rep.summary}</p>
                </div>

                {rep.location?.locality && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                    <span>{rep.location.locality}</span>
                  </div>
                )}

                {/* Verbatim Transcript snippet if available */}
                {rep.rawTranscript && (
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Original Speech: </span>
                    <span className="italic text-slate-600 dark:text-slate-400 font-mono text-[11px]">&quot;{rep.rawTranscript}&quot;</span>
                  </div>
                )}

                {/* Actions & Delete */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => setSelectedReport(rep)}
                    className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 underline"
                  >
                    View Full Report Details & Actions →
                  </button>

                  <button
                    onClick={() => handleDelete(rep.id, rep.deleteSecret)}
                    disabled={deletingId === rep.id}
                    className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingId === rep.id ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Report Inspection Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-sky-300">{selectedReport.id}</span>
                  <UrgencyBadge urgency={selectedReport.urgency} />
                  <StatusBadge status={selectedReport.status} />
                </div>
                <h3 className="font-bold text-base sm:text-lg">{selectedReport.title}</h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs sm:text-sm">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Summary</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedReport.summary}</p>
              </div>

              {selectedReport.rawTranscript && (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Verbatim Speech Record
                  </div>
                  <p className="italic text-slate-700 dark:text-slate-300 font-mono text-xs">&quot;{selectedReport.rawTranscript}&quot;</p>
                </div>
              )}

              {selectedReport.recommendedActions.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Recommended Next Actions</h4>
                  <div className="space-y-2">
                    {selectedReport.recommendedActions.map((act) => (
                      <div key={act.id} className="p-3 bg-sky-50/50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg text-xs">
                        <div className="font-bold text-sky-950 dark:text-sky-200">{act.title}</div>
                        {act.portalOrDesk && <div className="text-sky-700 dark:text-sky-400 text-[11px] mt-0.5">{act.portalOrDesk}</div>}
                        <ol className="list-decimal list-inside mt-1.5 space-y-0.5 text-slate-700 dark:text-slate-300">
                          {act.steps.map((st, i) => (
                            <li key={i}>{st}</li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <Link
                href="/map"
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <MapPin className="w-3.5 h-3.5" /> View Community Map
              </Link>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
