'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, MapPin, FolderClock } from 'lucide-react';
import { usePreferences } from './PreferencesContext';

export function Footer() {
  const { t } = usePreferences();

  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>SignalBridge</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Universal bridge between human intent and complex civic systems. Empowering citizens across English and all 22 Scheduled Indian Languages to organize evidence, resolve civic safety hazards, and navigate public welfare services.
            </p>
            <p className="text-[11px] text-slate-500">
              Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">OpenStreetMap</a> contributors.
            </p>
          </div>

          {/* Civic Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Citizen Tools
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition">
                  {t.reportProblem || 'Report a Problem'}
                </Link>
              </li>
              <li>
                <Link href="/my-reports" className="hover:text-white transition flex items-center gap-1">
                  <FolderClock className="w-3 h-3 text-sky-400" /> {t.myReports || 'My Past Reports'}
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-white transition flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-sky-400" /> {t.liveMap || 'Live Community Map'}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition">
                  {t.howItWorks || 'How It Works & Provenance'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy & Admin */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Trust & Administration
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-white transition flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" /> {t.privacy || 'Privacy Notice & Deletion'}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  {t.terms || 'Terms of Use & Disclaimers'}
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition flex items-center gap-1 text-slate-300">
                  <Lock className="w-3 h-3 text-amber-400" /> {t.adminPortal || 'Admin Moderation Portal'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            SignalBridge Public Service Technology. All rights reserved. Not an emergency dispatch operator.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:underline">
              {t.privacy || 'Privacy'}
            </Link>
            <Link href="/terms" className="hover:underline">
              {t.terms || 'Terms'}
            </Link>
            <Link href="/admin/login" className="hover:underline">
              {t.adminLogin || 'Admin Login'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
