'use client';

import React, { useState } from 'react';
import {
  Globe,
  Sun,
  Moon,
  Type,
  Eye,
  Sliders,
  Sparkles,
  Check,
} from 'lucide-react';
import { usePreferences } from './PreferencesContext';
import { SCHEDULED_INDIAN_LANGUAGES } from '@/lib/i18n/languages';

export function AccessibilityToolbar() {
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    currentLanguageMeta,
    t,
    textScale,
    increaseTextSize,
    decreaseTextSize,
    resetTextSize,
    highContrast,
    setHighContrast,
    reducedMotion,
    setReducedMotion,
  } = usePreferences();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isA11yOpen, setIsA11yOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {/* 22 Scheduled Indian Languages Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsLangOpen(!isLangOpen);
            setIsA11yOpen(false);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium shadow-2xs"
          aria-expanded={isLangOpen}
          aria-haspopup="true"
          title="Choose from English & 22 Scheduled Indian Languages"
        >
          <Globe className="w-3.5 h-3.5 text-sky-600" />
          <span className="hidden sm:inline font-semibold">{currentLanguageMeta.nativeName}</span>
          <span className="sm:hidden font-semibold">{currentLanguageMeta.code.toUpperCase()}</span>
        </button>

        {isLangOpen && (
          <div className="absolute right-0 mt-1.5 w-64 max-h-72 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-1.5 space-y-0.5">
            <div className="text-[11px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
              22 Scheduled Languages of India
            </div>
            {SCHEDULED_INDIAN_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsLangOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition ${
                  language === lang.code
                    ? 'bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{lang.nativeName} ({lang.name})</span>
                {language === lang.code && <Check className="w-3.5 h-3.5 text-sky-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Accessibility Controls Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsA11yOpen(!isA11yOpen);
            setIsLangOpen(false);
          }}
          className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium shadow-2xs"
          aria-expanded={isA11yOpen}
          aria-label="Accessibility options"
          title="Accessibility (Text Size, High Contrast, Motion)"
        >
          <Type className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </button>

        {isA11yOpen && (
          <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-3 space-y-3">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <span>Accessibility Controls</span>
              <span className="text-[10px] text-slate-400">WCAG 2.2 AA</span>
            </div>

            {/* Text Resizing Controls */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Text Scaling</div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={decreaseTextSize}
                  className="flex-1 py-1 px-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded font-bold text-xs"
                  title="Decrease font size"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={resetTextSize}
                  className="flex-1 py-1 px-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded font-medium text-xs"
                  title="Reset font size"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={increaseTextSize}
                  className="flex-1 py-1 px-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded font-bold text-xs"
                  title="Increase font size"
                >
                  A+
                </button>
              </div>
            </div>

            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">High Contrast</span>
              <button
                type="button"
                onClick={() => setHighContrast(!highContrast)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  highContrast
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {highContrast ? 'Enabled' : 'Off'}
              </button>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">Reduced Motion</span>
              <button
                type="button"
                onClick={() => setReducedMotion(!reducedMotion)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  reducedMotion
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {reducedMotion ? 'Enabled' : 'Off'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Theme Toggle: Strictly Light / Dark */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`p-1.5 rounded-md transition ${
            theme === 'light'
              ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-2xs font-semibold'
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
          title="Light Theme"
          aria-label="Switch to Light theme"
        >
          <Sun className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`p-1.5 rounded-md transition ${
            theme === 'dark'
              ? 'bg-white dark:bg-slate-700 text-sky-400 shadow-2xs font-semibold'
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
          title="Dark Theme"
          aria-label="Switch to Dark theme"
        >
          <Moon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
