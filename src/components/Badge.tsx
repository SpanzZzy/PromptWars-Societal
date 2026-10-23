import React from 'react';
import { Provenance, UrgencyLevel, WorkflowStatus, VisibilityStatus } from '@/lib/schemas/report';

export function ProvenanceBadge({ provenance }: { provenance: Provenance }) {
  switch (provenance) {
    case 'independently_verified':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" aria-hidden="true" />
          Independently Verified
        </span>
      );
    case 'extracted_from_source':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" aria-hidden="true" />
          Extracted from File
        </span>
      );
    case 'needs_confirmation':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" aria-hidden="true" />
          Needs Confirmation
        </span>
      );
    case 'user_reported':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-400" aria-hidden="true" />
          User Reported
        </span>
      );
  }
}

export function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  switch (urgency) {
    case 'critical':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800">
          Critical Hazard
        </span>
      );
    case 'high':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
          High Urgency
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          Medium
        </span>
      );
    case 'low':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
          Low
        </span>
      );
    case 'needs_review':
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
          Needs Review
        </span>
      );
  }
}

export function StatusBadge({ status }: { status: WorkflowStatus }) {
  switch (status) {
    case 'resolved':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
          Resolved
        </span>
      );
    case 'action_taken':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300">
          Action Taken
        </span>
      );
    case 'verified':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300">
          Verified
        </span>
      );
    case 'under_review':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
          Under Review
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          Closed
        </span>
      );
    case 'submitted':
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300">
          Submitted
        </span>
      );
  }
}

export function VisibilityBadge({ visibility }: { visibility: VisibilityStatus }) {
  switch (visibility) {
    case 'approved':
      return <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded">Public Map: Visible</span>;
    case 'rejected':
      return <span className="text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 px-2 py-0.5 rounded">Public Map: Rejected</span>;
    case 'private':
      return <span className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">Private</span>;
    case 'pending':
    default:
      return <span className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded">Public Map: Pending Review</span>;
  }
}

export function CategoryBadge({ category }: { category: string }) {
  switch (category) {
    case 'traffic_road_safety':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Traffic & Road Safety</span>;
    case 'weather_environment':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">Weather & Environment</span>;
    case 'news_public_info':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-950/70 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800">News & Fact-Check</span>;
    case 'photo_document_verification':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Document Intelligence</span>;
    case 'medical_health_records':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Medical & Health (Private)</span>;
    case 'document_public_service':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Public Service Assistance</span>;
    case 'civic_infrastructure':
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">Civic Infrastructure</span>;
  }
}
