'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  MapPin,
  AlertTriangle,
  Mic,
} from 'lucide-react';
import Link from 'next/link';
import { usePreferences } from './PreferencesContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  referencedReport?: {
    id: string;
    title: string;
    status: string;
    urgency: string;
    locality?: string;
  };
}

export function AssistantDrawer() {
  const { t, language } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;

      const speechCodeMap: Record<string, string> = {
        mr: 'mr-IN',
        hi: 'hi-IN',
        gu: 'gu-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        kn: 'kn-IN',
        bn: 'bn-IN',
        ml: 'ml-IN',
        pa: 'pa-IN',
        ur: 'ur-IN',
        en: 'en-IN',
        as: 'as-IN',
        or: 'or-IN',
        sa: 'sa-IN',
        ne: 'ne-NP',
        kok: 'kok-IN',
        mai: 'mai-IN',
        doi: 'doi-IN',
        ks: 'ks-IN',
        sd: 'sd-IN',
        sat: 'sat-IN',
        brx: 'brx-IN',
        mni: 'mni-IN',
      };
      recognition.lang = speechCodeMap[language] || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInput(transcript.trim());
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am your SignalBridge Civic AI Assistant for India. I can help you report road hazards, navigate civic processes, organize medical/official records, track submissions across Indian cities, or find emergency contacts (with live pilot data active for Pune).',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'What is happening in Kalyani Nagar?',
    'How do I file a traffic hazard report?',
    'National emergency helplines',
    'Explain the 6 report categories',
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history,
          preferredLanguage: language,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Assistant failed to respond');

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        referencedReport: data.referencedReport,
      };

      setMessages((prev) => [...prev, botMsg]);
      if (data.suggestedPrompts && Array.isArray(data.suggestedPrompts)) {
        setSuggestedPrompts(data.suggestedPrompts);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I am currently operating in offline mode. For emergency services across India, please contact National Dispatch (112) or Ambulance (108). ${err.message || ''}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Conversation cleared. How can I help you today with civic inquiries or reports across India?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 focus:ring-4 focus:ring-sky-300 focus:outline-none"
          aria-expanded={isOpen}
          aria-label="Open SignalBridge AI Assistant"
        >
          <Bot className="w-5 h-5 text-sky-200" />
          <span className="font-semibold text-xs sm:text-sm tracking-wide">
            {isOpen ? 'Close Assistant' : 'AI Civic Assistant'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      {/* Slide-out Assistant Modal / Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="SignalBridge AI Assistant"
          className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[420px] h-[580px] max-h-[80vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-4"
        >
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                  <span>SignalBridge AI Assistant</span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded font-mono font-medium">
                    Pan-India • Pune Pilot
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">Context-Aware Civic Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 text-slate-400 hover:text-white rounded-md transition"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md transition"
                aria-label="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px]">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* Referenced Report Card */}
                  {m.referencedReport && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 bg-sky-50/60 dark:bg-slate-900/60 p-2 rounded-lg">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-[11px] flex items-center justify-between">
                        <span>{m.referencedReport.title}</span>
                      </div>
                      {m.referencedReport.locality && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-sky-600" />
                          <span>{m.referencedReport.locality}</span>
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <Link
                          href="/map"
                          className="text-[10px] font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1 underline"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>View on Community Map</span>
                        </Link>
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[9px] mt-1 ${
                      m.role === 'user' ? 'text-sky-100 text-right' : 'text-slate-400 text-left'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-xs text-slate-500 dark:text-slate-400">
                <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                  <span>Consulting SignalBridge Gemini intelligence...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p)}
                className="whitespace-nowrap text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-700 px-2.5 py-1 rounded-full transition shadow-2xs flex-shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Form with Live Voice Input Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening actively... speak now..." : "Ask about road hazards, civic issues, medical records..."}
              disabled={loading}
              className="flex-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-lg transition focus:ring-2 focus:ring-rose-400 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Speak into chatbox (Voice-to-text)"
              aria-label="Speak into chatbox"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-lg transition focus:ring-2 focus:ring-sky-500"
              aria-label="Send message to assistant"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
