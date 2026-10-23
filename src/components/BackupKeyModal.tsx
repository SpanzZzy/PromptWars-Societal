'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Key, Eye, EyeOff, ShieldCheck, AlertCircle, X } from 'lucide-react';

interface BackupKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (key: string) => void;
  onClearKey: () => void;
  currentKey?: string;
  failureReason?: string;
}

export function BackupKeyModal({
  isOpen,
  onClose,
  onSaveKey,
  onClearKey,
  currentKey,
  failureReason,
}: BackupKeyModalProps) {
  const [inputKey, setInputKey] = useState(currentKey || '');
  const [showKey, setShowKey] = useState(false);
  const [consentTransmission, setConsentTransmission] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setValidationError('Please enter a valid Gemini API key.');
      return;
    }
    if (inputKey.trim().length < 20) {
      setValidationError('The key entered appears too short for a standard Gemini API key.');
      return;
    }
    if (!consentTransmission || !consentTerms) {
      setValidationError('You must review and check both consent items before proceeding.');
      return;
    }

    setValidationError(null);
    onSaveKey(inputKey.trim());
    onClose();
  };

  const handleClear = () => {
    setInputKey('');
    onClearKey();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-key-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-slate-800">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-sky-400" />
            <h2 id="backup-key-title" className="font-semibold text-lg">
              Optional: Use Your Own Gemini API Key
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-white rounded-lg p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm">
          {failureReason && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <span className="font-semibold">Why this is offered: </span>
                {failureReason}
              </div>
            </div>
          )}

          <p className="text-slate-600 leading-relaxed">
            SignalBridge ordinarily uses a server-configured key. Because the default key is either unconfigured or has reached its rate limit, you can optionally supply your personal Gemini API key to process this analysis live.
          </p>

          <p className="text-xs text-slate-500">
            You can obtain a free Gemini API key from{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 underline hover:text-sky-800 font-medium"
            >
              Google AI Studio
            </a>
            .
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="gemini-key-input" className="block font-medium text-slate-700 mb-1">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  id="gemini-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={(e) => {
                    setInputKey(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="AIzaSy..."
                  autoComplete="off"
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Explicit acknowledgements */}
            <div className="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentTransmission}
                  onChange={(e) => setConsentTransmission(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-slate-700">
                  I understand my key will be held in client memory only and sent transiently over HTTPS to SignalBridge&apos;s server exclusively to authenticate this specific request with Google&apos;s Gemini API. It is not saved in cookies, databases, or local storage.
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentTerms}
                  onChange={(e) => setConsentTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-slate-700">
                  I have reviewed and agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-sky-600 underline">
                    Terms of Use
                  </Link>
                  ,{' '}
                  <Link href="/privacy" target="_blank" className="text-sky-600 underline">
                    Privacy Notice
                  </Link>
                  , and Google&apos;s Gemini API terms.
                </span>
              </label>
            </div>

            {validationError && (
              <p className="text-red-600 text-xs font-semibold">{validationError}</p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!consentTransmission || !consentTerms || !inputKey.trim()}
                  className="px-4 py-2 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-xs sm:text-sm"
                >
                  Apply Key & Continue
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 text-xs sm:text-sm"
                >
                  Cancel (Stay in Demo Mode)
                </button>
              </div>

              {currentKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  Forget Key
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Zero persistent storage: Your key is discarded whenever you close or refresh this tab.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
