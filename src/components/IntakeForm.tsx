'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Music,
  Trash2,
  AlertCircle,
  Play,
  Pause,
  Loader2,
  Sparkles,
  MapPin,
  Globe,
  Navigation,
  CheckCircle2,
  X,
  Volume2,
} from 'lucide-react';
import { ReportCategory } from '@/lib/schemas/report';
import { usePreferences } from './PreferencesContext';
import { SCHEDULED_INDIAN_LANGUAGES } from '@/lib/i18n/languages';

export interface IntakeFileItem {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  base64Data: string;
  previewUrl?: string;
}

interface IntakeFormProps {
  onSubmitForExtraction: (data: {
    text: string;
    mediaFiles: IntakeFileItem[];
    categoryHint?: ReportCategory;
    locationHint?: string;
    preferredLanguage: string;
    rawTranscript?: string;
  }) => void;
  isLoading: boolean;
  error?: string | null;
  onOpenBackupKeyModal?: () => void;
  hasBackupKey?: boolean;
  initialCategory?: ReportCategory;
}

export function IntakeForm({
  onSubmitForExtraction,
  isLoading,
  error,
  onOpenBackupKeyModal,
  hasBackupKey,
  initialCategory,
}: IntakeFormProps) {
  const { language, setLanguage, t } = usePreferences();
  const [text, setText] = useState('');
  const [rawTranscript, setRawTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const latestInterimRef = useRef('');
  const [categoryHint, setCategoryHint] = useState<ReportCategory | ''>(initialCategory || 'civic_infrastructure');
  const [locationHint, setLocationHint] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<string>(language || 'en');
  const [mediaFiles, setMediaFiles] = useState<IntakeFileItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync categoryHint if initialCategory prop changes
  useEffect(() => {
    if (initialCategory) {
      setCategoryHint(initialCategory);
    }
  }, [initialCategory]);

  // Synchronize language when PreferencesContext changes
  useEffect(() => {
    if (language) {
      setPreferredLanguage(language);
    }
  }, [language]);

  // Live Speech-to-Text State (Web Speech API)
  const [isLiveListening, setIsLiveListening] = useState(false);
  const [speechApiSupported, setSpeechApiSupported] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<string>('mr-IN');
  const recognitionRef = useRef<any>(null);
  const shouldKeepListeningRef = useRef<boolean>(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Recording Fallback State (MediaRecorder API)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeObjectUrlsRef = useRef<Set<string>>(new Set());

  // Real-time Geolocation State
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccessNote, setLocationSuccessNote] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize Speech Recognition support detection and cleanup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechApiSupported(true);
      }
    }

    const urlsToClean = activeObjectUrlsRef.current;

    return () => {
      shouldKeepListeningRef.current = false;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      urlsToClean.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
      urlsToClean.clear();
    };
  }, []);

  // Update speech recognition language when preferred language or context language changes
  useEffect(() => {
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
    const targetCode = speechCodeMap[preferredLanguage] || speechCodeMap[language] || 'en-IN';
    setSpeechLanguage(targetCode);
  }, [preferredLanguage, language]);

  // Handle Live Speech-to-Text with continuous auto-restart across pauses
  const toggleLiveSpeech = () => {
    setValidationError(null);

    if (isLiveListening) {
      shouldKeepListeningRef.current = false;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      // Commit any pending interim speech
      if (latestInterimRef.current.trim()) {
        const chunk = latestInterimRef.current.trim();
        setText((prev) => (prev ? `${prev} ${chunk}` : chunk));
        setRawTranscript((prev) => (prev ? `${prev} ${chunk}` : chunk));
        setInterimTranscript('');
        latestInterimRef.current = '';
      }
      setIsLiveListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback to audio recorder if SpeechRecognition API is unavailable in browser
      startAudioRecording();
      return;
    }

    shouldKeepListeningRef.current = true;
    startSpeechRecognitionSession();
  };

  const startSpeechRecognitionSession = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || !shouldKeepListeningRef.current) return;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;

      recognition.onstart = () => {
        setIsLiveListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscriptChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscriptChunk += ' ' + item[0].transcript;
          } else {
            interimChunk += ' ' + item[0].transcript;
          }
        }

        if (interimChunk.trim()) {
          setInterimTranscript(interimChunk.trim());
          latestInterimRef.current = interimChunk.trim();
        }

        if (finalTranscriptChunk.trim()) {
          const chunk = finalTranscriptChunk.trim();
          setText((prev) => (prev ? `${prev} ${chunk}` : chunk));
          setRawTranscript((prev) => (prev ? `${prev} ${chunk}` : chunk));
          setInterimTranscript('');
          latestInterimRef.current = '';
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed') {
          shouldKeepListeningRef.current = false;
          setIsLiveListening(false);
          setValidationError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          // Normal pause in speech, will auto-restart in onend
        } else if (event.error === 'aborted') {
          // Intentionally aborted or restarted
        } else {
          console.warn(`Speech recognition event: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // If there was an uncommitted interim transcript, commit it to text
        if (latestInterimRef.current.trim()) {
          const chunk = latestInterimRef.current.trim();
          setText((prev) => (prev ? `${prev} ${chunk}` : chunk));
          setRawTranscript((prev) => (prev ? `${prev} ${chunk}` : chunk));
          setInterimTranscript('');
          latestInterimRef.current = '';
        }

        // If user hasn't explicitly stopped listening, automatically keep it alive after brief pause
        if (shouldKeepListeningRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            if (shouldKeepListeningRef.current) {
              try {
                recognition.start();
              } catch (e) {
                // If starting fails, retry by instantiating new session
                startSpeechRecognitionSession();
              }
            }
          }, 250);
        } else {
          setIsLiveListening(false);
        }
      };

      recognition.start();
    } catch (err: any) {
      console.warn('Could not launch speech recognition directly:', err);
      if (shouldKeepListeningRef.current) {
        setIsLiveListening(false);
        shouldKeepListeningRef.current = false;
        startAudioRecording();
      }
    }
  };

  // Audio Recording Fallback Handler
  const startAudioRecording = async () => {
    try {
      setValidationError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        activeObjectUrlsRef.current.add(audioUrl);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          const fileItem: IntakeFileItem = {
            id: `rec-${Date.now()}`,
            file: new File([audioBlob], `voice_recording.webm`, { type: 'audio/webm' }),
            name: `Voice_Note_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.webm`,
            type: 'audio/webm',
            size: audioBlob.size,
            base64Data,
            previewUrl: audioUrl,
          };
          setMediaFiles((prev) => [...prev, fileItem]);
        };
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      setValidationError('Microphone access denied. Please check your browser microphone permissions.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  // Real-time Geolocation Handler
  const handleUseCurrentLocation = () => {
    setValidationError(null);
    setLocationSuccessNote(null);

    if (!navigator.geolocation) {
      setValidationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coordsText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        try {
          // Attempt reverse geocoding via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
            {
              headers: { 'User-Agent': 'SignalBridge-CivicApp/1.0' },
            }
          );
          if (res.ok) {
            const data = await res.json();
            const locality =
              data.address?.suburb ||
              data.address?.neighbourhood ||
              data.address?.city_district ||
              data.address?.city ||
              '';
            const city = data.address?.city || data.address?.state_district || '';
            const detectedName = locality ? `${locality}, ${city}` : coordsText;

            setLocationHint(detectedName);
            setLocationSuccessNote(`Location detected: ${detectedName} (approximate)`);
          } else {
            setLocationHint(coordsText);
            setLocationSuccessNote(`Coordinates detected: ${coordsText}`);
          }
        } catch {
          setLocationHint(coordsText);
          setLocationSuccessNote(`Coordinates detected: ${coordsText}`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setValidationError('Location access was denied. You can manually enter your neighborhood or landmark.');
            break;
          case error.POSITION_UNAVAILABLE:
            setValidationError('Location information is currently unavailable. Please enter your location manually.');
            break;
          case error.TIMEOUT:
            setValidationError('Location request timed out. Please try again or type your landmark.');
            break;
          default:
            setValidationError('Unable to retrieve location. Please enter manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  // File Upload Handlers
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setValidationError(null);

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxFileSize) {
        setValidationError(`File "${file.name}" exceeds the 10MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        let previewUrl: string | undefined;
        if (file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file);
          activeObjectUrlsRef.current.add(previewUrl);
        }
        const newItem: IntakeFileItem = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          base64Data,
          previewUrl,
        };
        setMediaFiles((prev) => [...prev, newItem]);
      };
    });
  };

  const removeFile = (id: string) => {
    setMediaFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
        activeObjectUrlsRef.current.delete(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (isLiveListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsLiveListening(false);
    }
    if (isRecordingAudio) {
      stopAudioRecording();
    }

    if (!text.trim() && mediaFiles.length === 0) {
      setValidationError('Please describe the issue or attach a voice note, photo, or document.');
      return;
    }

    onSubmitForExtraction({
      text: text.trim(),
      rawTranscript: rawTranscript.trim() || undefined,
      mediaFiles,
      categoryHint: (categoryHint as ReportCategory) || undefined,
      locationHint: locationHint.trim() || undefined,
      preferredLanguage,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-7 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          {t.reportProblem || 'Report a Problem or Public Service Inquiry'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Type your message, speak live in <strong>Marathi, Hindi, or English</strong>, or upload photos and documents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Domain & Language Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Issue Domain / Category
            </label>
            <select
              id="category-select"
              value={categoryHint}
              onChange={(e) => setCategoryHint(e.target.value as ReportCategory)}
              className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-sky-500"
            >
              <option value="traffic_road_safety">1. Traffic & Road Safety (Car Crash, Blockage, Accidents)</option>
              <option value="civic_infrastructure">2. Civic Infrastructure & Safety (Potholes, Live Wires, Drainage)</option>
              <option value="weather_environment">3. Weather & Environmental Alerts (Flooding, Heavy Rain, Storms)</option>
              <option value="news_public_info">4. News & Fact-Check Verification (Rumors, Official Advisories)</option>
              <option value="photo_document_verification">5. Photos, Screenshots & Document Intelligence (Notices, Stamp OCR)</option>
              <option value="medical_health_records">6. Medical History & Health Records (Private Lab Reports, Prescriptions)</option>
              <option value="document_public_service">Public Service Assistance (Pension, Ration, Aadhaar, Certificates)</option>
              <option value="other">Other Community Grievance</option>
            </select>
          </div>

          <div>
            <label htmlFor="language-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Language of Report & Speech
            </label>
            <select
              id="language-select"
              value={preferredLanguage}
              onChange={(e) => {
                const newLang = e.target.value;
                setPreferredLanguage(newLang);
                setLanguage(newLang);
              }}
              className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-sky-500"
            >
              {SCHEDULED_INDIAN_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Central Text & Live Voice Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="description-textarea" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {t.describeIssue || 'Describe the Problem or Speak Live'}
            </label>

            {/* Live Voice Input Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLiveSpeech}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition shadow-xs ${
                  isLiveListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900'
                }`}
                title="Speak live and see your words typed in real time"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isLiveListening ? (t.stopListening || 'Stop Listening') : (t.speakLive || 'Speak Live (मराठी / हिंदी / EN)')}</span>
              </button>
            </div>
          </div>

          {/* Active speech indicator with REAL-TIME interim words preview */}
          {isLiveListening && (
            <div
              role="status"
              aria-live="polite"
              className="mb-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs p-3 rounded-xl flex flex-col gap-2 shadow-xs animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold">
                  <Volume2 className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
                  <span>{t.listeningNotice || 'Listening actively... Speak naturally in your selected language.'}</span>
                </span>
                <button
                  type="button"
                  onClick={toggleLiveSpeech}
                  className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline px-2.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60"
                >
                  Done
                </button>
              </div>

              {/* Spoken words live feedback box */}
              <div className="bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800/80 text-xs font-mono">
                <span className="text-slate-400 dark:text-slate-500 font-sans mr-1.5 text-[11px] font-semibold">Live Transcribing:</span>
                <span className="text-slate-900 dark:text-white font-bold">
                  {interimTranscript || (text.slice(-80) || 'Listening... say "Hello"')}
                </span>
              </div>
            </div>
          )}

          <textarea
            id="description-textarea"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your complaint, speak live with the microphone above, or paste an official notice..."
            className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 font-sans leading-relaxed"
          />
        </div>

        {/* Optional Location with Real-time GPS detection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="location-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> {t.landmarkLabel || 'Locality, City or Landmark (Anywhere in India)'}
            </label>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 text-xs text-sky-700 dark:text-sky-300 hover:text-sky-900 font-semibold bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 px-2.5 py-1 rounded-md transition disabled:opacity-50"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3 h-3" />
                  <span>{t.useCurrentLocation || 'Use My Current Location'}</span>
                </>
              )}
            </button>
          </div>

          <input
            id="location-input"
            type="text"
            value={locationHint}
            onChange={(e) => setLocationHint(e.target.value)}
            placeholder="e.g. Kalyani Nagar, Pune • Connaught Place, Delhi • MG Road, Bengaluru • Anna Nagar, Chennai"
            className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
          />

          {locationSuccessNote && (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {locationSuccessNote}
            </p>
          )}
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            * Note: For privacy, SignalBridge never displays residential addresses or exact home coordinates on the public map.
          </p>
        </div>

        {/* File Attachments with Image Previews */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            Attach Evidence (Photographs, Screenshots, PDFs, Audio)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-400 rounded-xl p-5 text-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 hover:bg-sky-50/40 dark:hover:bg-slate-800 transition group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,audio/*,application/pdf,text/plain"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <UploadCloud className="w-7 h-7 mx-auto text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition" />
            <p className="mt-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
              Click to select or drag and drop files
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Supports Photos (JPEG, PNG), Voice notes (MP3, WAV, WebM), and Documents (PDF, TXT) up to 10MB each.
            </p>
          </div>
        </div>

        {/* Uploaded Files Previews (Visual Thumbnails for Images) */}
        {mediaFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Attached Evidence ({mediaFiles.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {mediaFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs relative overflow-hidden group"
                >
                  {/* Image Thumbnail Preview (transient Blob URL) */}
                  {file.previewUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={file.previewUrl}
                      alt={`Attached evidence: ${file.name}`}
                      className="w-12 h-12 object-cover rounded flex-shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                  ) : file.type.startsWith('audio/') ? (
                    <div className="w-12 h-12 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Music className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 truncate">
                    <div className="font-medium text-slate-800 dark:text-slate-100 truncate">{file.name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                      {(file.size / 1024).toFixed(0)} KB
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error notification */}
        {(validationError || error) && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 p-3 rounded-lg text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{validationError || error}</p>
              {onOpenBackupKeyModal && (
                <button
                  type="button"
                  onClick={onOpenBackupKeyModal}
                  className="mt-1.5 font-bold text-sky-700 dark:text-sky-400 underline block"
                >
                  {hasBackupKey ? 'Manage Backup Gemini API Key' : 'Optional: Supply your personal Gemini API key'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Submit to Stage 2: Review */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Stage 1 of 4: <span className="font-semibold text-slate-700 dark:text-slate-200">Intake & Extraction</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting Content...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Review & Confirm</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
