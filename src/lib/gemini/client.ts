import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

export const PRIMARY_MODEL_NAME = 'gemini-2.5-flash';
export const SECONDARY_MODEL_NAME = 'gemini-2.0-flash';
export const FALLBACK_MODEL_NAME = 'gemini-1.5-flash';

export const SUPPORTED_MODELS = [
  PRIMARY_MODEL_NAME,
  SECONDARY_MODEL_NAME,
  FALLBACK_MODEL_NAME,
];

export interface GeminiKeyInfo {
  key: string | null;
  source: 'user_backup' | 'process.env.GEMINI_API_KEY' | 'process.env.GOOGLE_API_KEY' | 'process.env.GOOGLE_GENAI_API_KEY' | '.env.local' | '.env' | 'none';
  maskedKey: string | null;
}

export interface GeminiClientResolution {
  ai: GoogleGenAI | null;
  mode: 'server_key' | 'backup_key' | 'demo_mock';
  apiKeyUsed?: string;
  keyInfo: GeminiKeyInfo;
  error?: string;
}

/**
 * Mask an API key for safe display (e.g. AIzaSy...7890)
 */
export function maskApiKey(key: string | null | undefined): string | null {
  if (!key || key.length < 10) return null;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

/**
 * Dynamically resolves the API key from multiple environment names and on-disk files.
 * This guarantees that if a user sets or updates .env.local while the server is running,
 * the key is detected immediately without requiring a manual server restart.
 */
export function resolveApiKey(userBackupApiKey?: string): GeminiKeyInfo {
  // 1. Transient user backup key passed with request
  const sanitizedBackup = userBackupApiKey?.trim();
  if (sanitizedBackup && sanitizedBackup.length > 10) {
    return {
      key: sanitizedBackup,
      source: 'user_backup',
      maskedKey: maskApiKey(sanitizedBackup),
    };
  }

  // 2. Check standard environment variables
  if (process.env.GEMINI_API_KEY?.trim() && process.env.GEMINI_API_KEY.trim().length > 10) {
    const key = process.env.GEMINI_API_KEY.trim();
    return { key, source: 'process.env.GEMINI_API_KEY', maskedKey: maskApiKey(key) };
  }
  if (process.env.GOOGLE_API_KEY?.trim() && process.env.GOOGLE_API_KEY.trim().length > 10) {
    const key = process.env.GOOGLE_API_KEY.trim();
    return { key, source: 'process.env.GOOGLE_API_KEY', maskedKey: maskApiKey(key) };
  }
  if (process.env.GOOGLE_GENAI_API_KEY?.trim() && process.env.GOOGLE_GENAI_API_KEY.trim().length > 10) {
    const key = process.env.GOOGLE_GENAI_API_KEY.trim();
    return { key, source: 'process.env.GOOGLE_GENAI_API_KEY', maskedKey: maskApiKey(key) };
  }

  // 3. Directly inspect .env.local and .env on disk for real-time changes
  const envFiles = ['.env.local', '.env'];
  for (const envFile of envFiles) {
    try {
      const fullPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const match = line.match(/^\s*(?:GEMINI_API_KEY|GOOGLE_API_KEY|GOOGLE_GENAI_API_KEY)\s*=\s*([^\r\n#]*)/);
          if (match && match[1]) {
            let val = match[1].trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1).trim();
            }
            if (val.length > 10 && !val.includes('your_') && !val.includes('your-key')) {
              // Synchronize to process.env for downstream libraries
              process.env.GEMINI_API_KEY = val;
              return {
                key: val,
                source: envFile as any,
                maskedKey: maskApiKey(val),
              };
            }
          }
        }
      }
    } catch {
      // Ignore file read error
    }
  }

  return {
    key: null,
    source: 'none',
    maskedKey: null,
  };
}

/**
 * Resolves a Google GenAI client instance.
 */
export function getGeminiClient(userBackupApiKey?: string): GeminiClientResolution {
  const keyInfo = resolveApiKey(userBackupApiKey);

  if (keyInfo.key) {
    return {
      ai: new GoogleGenAI({ apiKey: keyInfo.key }),
      mode: keyInfo.source === 'user_backup' ? 'backup_key' : 'server_key',
      apiKeyUsed: keyInfo.key,
      keyInfo,
    };
  }

  return {
    ai: null,
    mode: 'demo_mock',
    keyInfo,
    error: 'No server GEMINI_API_KEY or GOOGLE_API_KEY detected in environment or .env.local.',
  };
}

/**
 * Analyzes an error to determine if it is eligible for offering the backup key flow.
 */
export function isEligibleForBackupKey(error: unknown): boolean {
  if (!error) return false;
  const msg = String(error instanceof Error ? error.message : error).toLowerCase();

  return (
    msg.includes('api_key_invalid') ||
    msg.includes('api key not valid') ||
    msg.includes('invalid api key') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('429') ||
    msg.includes('permission_denied') ||
    msg.includes('unauthenticated') ||
    msg.includes('no server gemini_api_key') ||
    msg.includes('unauthorized')
  );
}

/**
 * Safe status information about the Gemini integration (never exposes full keys)
 */
export function getGeminiDiagnostics() {
  const keyInfo = resolveApiKey();
  return {
    isConfigured: Boolean(keyInfo.key),
    source: keyInfo.source,
    maskedKey: keyInfo.maskedKey,
    primaryModel: PRIMARY_MODEL_NAME,
    supportedModels: SUPPORTED_MODELS,
  };
}
