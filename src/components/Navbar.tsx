'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio, MapPin, HelpCircle, Shield, Menu, X, PlusCircle, FolderClock } from 'lucide-react';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import { usePreferences } from './PreferencesContext';

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = usePreferences();

  const navLinks = [
    { href: '/', label: t.reportProblem, icon: PlusCircle, isCta: true },
    { href: '/my-reports', label: t.myReports, icon: FolderClock },
    { href: '/map', label: t.liveMap, icon: MapPin },
    { href: '/how-it-works', label: t.howItWorks, icon: HelpCircle },
    { href: '/privacy', label: t.privacy, icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Tagline */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-lg tracking-tight hover:opacity-90 transition focus:ring-2 focus:ring-sky-500 rounded-md p-1"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-600 text-white shadow-sm">
                <Radio className="w-4 h-4" />
              </span>
              <span>SignalBridge</span>
            </Link>
            <span className="hidden sm:inline-flex items-center text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
              {t.platformSubtitle || 'Civic Intelligence & Action Platform'}
            </span>
          </div>

          {/* Desktop Navigation & Accessibility Controls */}
          <div className="hidden md:flex items-center gap-3">
            <AccessibilityToolbar />

            <nav className="flex items-center gap-1" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                if (link.isCta) {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs ${
                        isActive
                          ? 'bg-sky-700 text-white'
                          : 'bg-sky-600 text-white hover:bg-sky-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'text-sky-700 bg-sky-50 dark:bg-slate-800 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Mobile Menu & A11y Controls */}
          <div className="flex md:hidden items-center gap-2">
            <AccessibilityToolbar />
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1" id="mobile-menu">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
