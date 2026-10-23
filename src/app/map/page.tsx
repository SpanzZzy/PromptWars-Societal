import React from 'react';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { MapPin, ShieldCheck, Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Live Community Map — SignalBridge',
  description: 'View public, approved community reports across civic safety, roads, and public services with OpenStreetMap.',
};

const CommunityMap = dynamic(
  () => import('@/components/CommunityMap').then((mod) => mod.CommunityMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 min-h-[450px] sm:min-h-[550px] flex items-center justify-center text-slate-500 text-sm">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Loader2 className="w-5 h-5 animate-spin text-sky-600 dark:text-sky-400" />
          <span>Loading Interactive Community Map...</span>
        </div>
      </div>
    ),
  }
);

export default function MapPage() {
  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-slate-800 dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400 mb-1">
            <MapPin className="w-4 h-4" />
            <span>Community Transparency Feed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Live Community Safety & Infrastructure Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Displays public, admin-reviewed community reports. Only verified and approved cases appear on this map.
          </p>
        </div>

        {/* Privacy Note */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-300 max-w-sm flex items-start gap-2 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-100">Privacy Safe: </span>
            Exact residential coordinates and private documents are never published. Locations are generalized to ward or street levels.
          </div>
        </div>
      </div>

      {/* Interactive Map Component */}
      <CommunityMap />
    </div>
  );
}
