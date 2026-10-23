'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Eye,
  Filter,
  RefreshCw,
  Trash2,
  Save,
  Shield,
  Layers,
  Building,
  UserCheck,
} from 'lucide-react';
import { SignalReport, WorkflowStatus, VisibilityStatus, UrgencyLevel } from '@/lib/schemas/report';
import { ProvenanceBadge, UrgencyBadge, StatusBadge, VisibilityBadge } from '@/components/Badge';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    pendingReview: number;
    publicApproved: number;
    resolved: number;
    actionTaken: number;
  } | null>(null);
  const [reports, setReports] = useState<SignalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<SignalReport | null>(null);

  // Edit state for selected report
  const [editStatus, setEditStatus] = useState<WorkflowStatus>('submitted');
  const [editVisibility, setEditVisibility] = useState<VisibilityStatus>('pending');
  const [editUrgency, setEditUrgency] = useState<UrgencyLevel>('medium');
  const [editNotes, setEditNotes] = useState('');
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  // Check auth & load data
  const checkAuthAndLoad = useCallback(async () => {
    setLoading(true);
    try {
      const statusRes = await fetch('/api/admin/status');
      const statusData = await statusRes.json();

      if (!statusData.isAuthenticated) {
        setIsAuthenticated(false);
        router.push('/admin/login');
        return;
      }

      setIsAuthenticated(true);
      setUsername(statusData.username);
      setStats(statusData.stats);

      // Load all reports with admin privileges
      const reportsRes = await fetch('/api/reports?admin=true');
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.reports || []);
      }
    } catch (err: unknown) {
      console.error('Admin loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuthAndLoad();
  }, [checkAuthAndLoad]);

  const handleSelectReport = (rep: SignalReport) => {
    setSelectedReport(rep);
    setEditStatus(rep.status);
    setEditVisibility(rep.publicVisibility);
    setEditUrgency(rep.urgency);
    setEditNotes(rep.adminNotes || '');
    setUpdateMessage(null);
  };

  const handleSaveReportChanges = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    setUpdateMessage(null);

    try {
      const res = await fetch(`/api/reports/${selectedReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          publicVisibility: editVisibility,
          urgency: editUrgency,
          adminNotes: editNotes,
        }),
      });

      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();

      // Update in local state
      setReports((prev) =>
        prev.map((r) => (r.id === selectedReport.id ? data.report : r))
      );
      setSelectedReport(data.report);
      setUpdateMessage('Report updated successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setUpdateMessage(`Error: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm(`Are you sure you want to permanently delete report ${id}?`)) return;

    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Delete error: ${msg}`);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (loading || isAuthenticated === null) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-slate-500 text-sm">
          Loading Admin Demo Desk...
        </div>
      </div>
    );
  }

  const filteredReports = reports.filter((r) => {
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Admin Moderation & Dispatch Desk
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Logged in as <strong className="text-slate-700 dark:text-slate-200">{username}</strong>. Server-side session active.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs transition"
          >
            Public Site
          </Link>
          <button
            onClick={checkAuthAndLoad}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-800 font-medium shadow-xs transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Reports
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.total}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">All persisted cases</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending Review
            </div>
            <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">
              {stats.pendingReview}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Needs moderation</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Public Map Visible
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
              {stats.publicApproved}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Approved for map</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-blue-600 dark:text-sky-400 uppercase tracking-wider">
              Resolved / Actions
            </div>
            <div className="text-2xl font-extrabold text-blue-700 dark:text-sky-400 mt-1">
              {stats.resolved + stats.actionTaken}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Dispatched or closed</div>
          </div>
        </div>
      )}

      {/* Main Layout: Reports Queue & Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports Queue (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Queue Filters:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Domains</option>
                <option value="traffic_road_safety">Traffic & Road Safety</option>
                <option value="civic_infrastructure">Civic Infrastructure</option>
                <option value="weather_environment">Weather & Flood Alerts</option>
                <option value="news_public_info">News & Fact-Check</option>
                <option value="photo_document_verification">Document & Photo OCR</option>
                <option value="medical_health_records">Medical & Health Records</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="verified">Verified</option>
                <option value="action_taken">Action Taken</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 flex justify-between">
              <span>Report Queue ({filteredReports.length})</span>
              <span className="text-slate-400 dark:text-slate-500">Click item to inspect and moderate</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
              {filteredReports.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  No reports match the selected filters.
                </div>
              ) : (
                filteredReports.map((rep) => (
                  <div
                    key={rep.id}
                    onClick={() => handleSelectReport(rep)}
                    className={`p-4 transition cursor-pointer ${
                      selectedReport?.id === rep.id
                        ? 'bg-sky-50/70 dark:bg-sky-950/40 border-l-4 border-l-sky-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {rep.id}
                        </span>
                        <UrgencyBadge urgency={rep.urgency} />
                        {rep.isDemoData && (
                          <span className="text-[10px] font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded">
                            DEMO
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={rep.status} />
                        <VisibilityBadge visibility={rep.publicVisibility} />
                      </div>
                    </div>

                    <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {rep.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-1 mt-0.5">
                      {rep.summary}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                      <span>{rep.location?.locality || 'Locality unlisted'}</span>
                      <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Selected Report Moderation Panel (1 col) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Moderation & Workflow Controls</span>
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Review evidence, update status, and control public map visibility.
            </p>
          </div>

          {!selectedReport ? (
            <div className="text-center py-16 text-xs text-slate-400 dark:text-slate-500">
              Select a report from the queue to review and take action.
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Report ID:</span>
                <span className="font-mono ml-2 text-slate-600 dark:text-slate-400">{selectedReport.id}</span>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Title:</span>
                <div className="text-slate-900 dark:text-white font-medium mt-0.5">{selectedReport.title}</div>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Summary:</span>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{selectedReport.summary}</p>
              </div>

              {/* Workflow Status Controls */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Workflow Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as WorkflowStatus)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="verified">Verified (Official Field Checked)</option>
                  <option value="action_taken">Action Taken (Dispatched)</option>
                  <option value="resolved">Resolved (Completed)</option>
                  <option value="rejected">Rejected / Closed</option>
                </select>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  * Note: Admin approval does not automatically prove factual verification.
                </p>
              </div>

              {/* Public Map Visibility */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Public Map Visibility
                </label>
                <select
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value as VisibilityStatus)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="approved">Approved (Visible on Public Map)</option>
                  <option value="pending">Pending Review (Hidden)</option>
                  <option value="private">Private (Only Admin & Author)</option>
                  <option value="rejected">Rejected (Hidden)</option>
                </select>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Internal Admin Notes
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Notes on field visit, ward contact, or follow-up docket number..."
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {updateMessage && (
                <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-lg text-[11px] text-sky-800 dark:text-sky-200">
                  {updateMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSaveReportChanges}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white rounded-lg font-semibold shadow-xs transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteReport(selectedReport.id)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900/60 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
