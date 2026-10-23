'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SCHEDULED_INDIAN_LANGUAGES, LanguageOption, getUiTranslations, UiTranslations } from '@/lib/i18n/languages';

type ThemeMode = 'light' | 'dark';
type TextScale = 'normal' | 'large' | 'larger';

interface PreferencesContextType {
  // Theme
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
  // Language
  language: string;
  setLanguage: (lang: string) => void;
  currentLanguageMeta: LanguageOption;
  t: UiTranslations;
  // Accessibility
  textScale: TextScale;
  setTextScale: (s: TextScale) => void;
  increaseTextSize: () => void;
  decreaseTextSize: () => void;
  resetTextSize: () => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [language, setLanguageState] = useState<string>('en');
  const [textScale, setTextScaleState] = useState<TextScale>('normal');
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [reducedMotion, setReducedMotionState] = useState<boolean>(false);

  // Load saved preferences on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedTheme = localStorage.getItem('sb_theme') as ThemeMode;
      if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
        setThemeState(savedTheme);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setThemeState('dark');
      }

      const savedLang = localStorage.getItem('sb_lang');
      if (savedLang) {
        setLanguageState(savedLang);
      }

      const savedTextScale = localStorage.getItem('sb_text_scale') as TextScale;
      if (savedTextScale && ['normal', 'large', 'larger'].includes(savedTextScale)) {
        setTextScaleState(savedTextScale);
      }

      const savedContrast = localStorage.getItem('sb_high_contrast');
      if (savedContrast === 'true') {
        setHighContrastState(true);
      }

      const savedMotion = localStorage.getItem('sb_reduced_motion');
      if (savedMotion === 'true') {
        setReducedMotionState(true);
      }
    } catch {}
  }, []);

  // Apply Theme to <html> class
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Apply Text Scale
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('text-scale-large', 'text-scale-larger');

    if (textScale === 'large') {
      root.classList.add('text-scale-large');
    } else if (textScale === 'larger') {
      root.classList.add('text-scale-larger');
    }
  }, [textScale]);

  // Apply High Contrast
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Apply RTL for languages like Urdu / Kashmiri / Sindhi
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const meta = SCHEDULED_INDIAN_LANGUAGES.find((l) => l.code === language);
    if (meta?.isRTL) {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }, [language]);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    try {
      localStorage.setItem('sb_theme', t);
    } catch {}
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('sb_lang', lang);
    } catch {}
  };

  const setTextScale = (s: TextScale) => {
    setTextScaleState(s);
    try {
      localStorage.setItem('sb_text_scale', s);
    } catch {}
  };

  const increaseTextSize = () => {
    if (textScale === 'normal') setTextScale('large');
    else if (textScale === 'large') setTextScale('larger');
  };

  const decreaseTextSize = () => {
    if (textScale === 'larger') setTextScale('large');
    else if (textScale === 'large') setTextScale('normal');
  };

  const resetTextSize = () => {
    setTextScale('normal');
  };

  const setHighContrast = (v: boolean) => {
    setHighContrastState(v);
    try {
      localStorage.setItem('sb_high_contrast', String(v));
    } catch {}
  };

  const setReducedMotion = (v: boolean) => {
    setReducedMotionState(v);
    try {
      localStorage.setItem('sb_reduced_motion', String(v));
    } catch {}
  };

  const currentLanguageMeta =
    SCHEDULED_INDIAN_LANGUAGES.find((l) => l.code === language) || SCHEDULED_INDIAN_LANGUAGES[0];

  const t = getUiTranslations(language);

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        language,
        setLanguage,
        currentLanguageMeta,
        t,
        textScale,
        setTextScale,
        increaseTextSize,
        decreaseTextSize,
        resetTextSize,
        highContrast,
        setHighContrast,
        reducedMotion,
        setReducedMotion,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
