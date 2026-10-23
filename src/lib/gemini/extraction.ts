import { getGeminiClient, SUPPORTED_MODELS } from './client';
import { ExtractionRequest, ExtractionResponse, ImageObservation } from '../schemas/report';
import { formatUntrustedContent } from '../utils/sanitizer';

/**
 * Stage A: Extract text from multimodal input (audio voice recordings, images, PDFs, text)
 * and perform language detection with confidence notes.
 */
export async function extractAndTranscribe(
  request: ExtractionRequest
): Promise<ExtractionResponse> {
  const { text, mediaFiles = [], preferredLanguage, userBackupApiKey } = request;
  const clientResolution = getGeminiClient(userBackupApiKey);

  // If no Gemini client is available, provide deterministic, realistic demo extraction
  if (!clientResolution.ai) {
    return generateDemoExtraction(text, mediaFiles, preferredLanguage);
  }

  const ai = clientResolution.ai;

  try {
    const parts: any[] = [];

    // System instruction prompt to guide extraction and transcription
    const promptIntro = `
You are the SignalBridge Stage-A Multimodal Extractor and Transcriber.
Your task:
1. AUDIO / SPEECH:
   - If audio is provided: Transcribe spoken words verbatim.
   - Detect spoken language accurately (Hindi, Marathi, English, or mixed code-switching).
   - Retain the original-language script (Devanagari for Hindi/Marathi, Latin script for English).
   - Do NOT replace original speech with an English translation or polished summary.
   - If the user spoke in Hindi or Marathi, provide an optional English translation in "translatedText".
   - If audio is unclear or noisy, record an explicit warning.
2. IMAGE UNDERSTANDING:
   - For every provided image or screenshot, analyze its ACTUAL VISUAL CONTENT directly.
   - Identify visible road/infrastructure defects (e.g. pothole size, exposed live wires, waterlogging, broken covers) or photographed document text/stamps.
   - Return structured visual observations for each image under "imageObservations".
   - Extract legible signs, asset codes, or text from photographed notices.
3. TYPED TEXT:
   - Incorporate user-typed notes into the extractedText synthesis.
4. OUTPUT FORMAT:
   Return strictly valid JSON matching this schema:
{
  "extractedText": "Combined, clean readable text synthesizing transcript and document contents in original language",
  "originalTranscript": "Verbatim transcript of speech if audio was present, otherwise empty string",
  "translatedText": "English translation of original speech/text if original was in Hindi or Marathi, otherwise null",
  "detectedLanguage": "hi | mr | en | mixed | other",
  "detectedLanguageName": "Full name like Hindi (हिंदी), Marathi (मराठी), English, or Mixed",
  "languageConfidence": "high | medium | low",
  "warnings": ["Array of warnings e.g. background noise, image blur, partial illegibility"],
  "processedFiles": [
    {
      "name": "Filename",
      "type": "audio | image | document",
      "summary": "One sentence summary of extracted content"
    }
  ],
  "imageObservations": [
    {
      "fileName": "Filename of image",
      "visibleDetails": "Specific physical observations visible in this photograph (e.g. 2ft crater pothole with water pooling)",
      "extractedText": "Any text, road signs, or pole codes visible in the image"
    }
  ],
  "isEmergencyAlert": true | false (true only if severe hazard like sparking high-voltage wires, fire, gas leak, active collapse)
}
Return ONLY the raw JSON object. Do not wrap in markdown code blocks.
`;
    parts.push({ text: promptIntro });

    if (text?.trim()) {
      parts.push({
        text: formatUntrustedContent(text.trim(), 'user_text_notes'),
      });
    }

    // Attach media files as inlineData parts
    for (const file of mediaFiles) {
      if (file.base64Data && file.type) {
        // Strip data: prefix if present
        const cleanBase64 = file.base64Data.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: file.type,
            data: cleanBase64,
          },
        });
      }
    }

    // Call Gemini model across supported model hierarchy
    let responseText = '';
    let lastError: any = null;

    for (const modelName of SUPPORTED_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: parts,
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} attempt failed, trying fallback:`, err.message);
      }
    }

    if (!responseText && lastError) {
      const errMsg = String(lastError?.message || lastError);
      if (errMsg.includes('ENOTFOUND') || errMsg.includes('fetch failed') || errMsg.includes('ETIMEDOUT')) {
        console.warn('Network unreachable, falling back to deterministic extraction:', errMsg);
        return generateDemoExtraction(text, mediaFiles, preferredLanguage);
      }
      throw lastError;
    }

    // Parse JSON from model response
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      success: true,
      extractedText: parsed.extractedText || text || '',
      originalTranscript: parsed.originalTranscript || '',
      translatedText: parsed.translatedText || undefined,
      detectedLanguage: parsed.detectedLanguage || 'en',
      detectedLanguageName: parsed.detectedLanguageName || 'English',
      languageConfidence: parsed.languageConfidence || 'medium',
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      processedFiles: Array.isArray(parsed.processedFiles) ? parsed.processedFiles : [],
      imageObservations: Array.isArray(parsed.imageObservations) ? parsed.imageObservations : [],
      isEmergencyAlert: Boolean(parsed.isEmergencyAlert),
      isDemoMode: false,
    };
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    if (errMsg.includes('ENOTFOUND') || errMsg.includes('fetch failed') || errMsg.includes('ETIMEDOUT')) {
      console.warn('Network unreachable in extraction, returning deterministic demo mode:', errMsg);
      return generateDemoExtraction(text, mediaFiles, preferredLanguage);
    }
    console.error('Gemini extraction error:', err);
    throw err;
  }
}

/**
 * Deterministic demo fallback extraction when credentials are not configured.
 */
function generateDemoExtraction(
  text?: string,
  mediaFiles: any[] = [],
  preferredLanguage: string = 'en'
): ExtractionResponse {
  const fileSummaries = mediaFiles.map(f => {
    const isAudio = f.type.startsWith('audio');
    const isImg = f.type.startsWith('image');
    return {
      name: f.name || 'uploaded_attachment',
      type: isAudio ? 'audio' : isImg ? 'image' : 'document',
      summary: isAudio
        ? 'Voice note audio extracted (Hindi/Marathi/English speech)'
        : isImg
        ? 'Visual photographic evidence analyzed'
        : 'Document text and official headers extracted',
    };
  });

  const rawText = text?.trim() || '';
  const hasMarathi = /[\u0900-\u097F]/.test(rawText) && (rawText.includes('रस्ता') || rawText.includes('पाणी') || rawText.includes('आहे') || rawText.includes('नाही'));
  const hasHindi = /[\u0900-\u097F]/.test(rawText) && (rawText.includes('सड़क') || rawText.includes('बिजली') || rawText.includes('समस्या') || rawText.includes('कृपया'));

  let detectedLanguage = preferredLanguage || 'en';
  let detectedLanguageName = 'English';

  if (hasMarathi) {
    detectedLanguage = 'mr';
    detectedLanguageName = 'Marathi (मराठी)';
  } else if (hasHindi) {
    detectedLanguage = 'hi';
    detectedLanguageName = 'Hindi (हिंदी)';
  } else if (/[\u0900-\u097F]/.test(rawText)) {
    detectedLanguage = preferredLanguage || 'hi';
    detectedLanguageName = 'Devanagari script';
  } else if (/[\u0980-\u09FF]/.test(rawText)) {
    detectedLanguage = preferredLanguage === 'as' ? 'as' : 'bn';
    detectedLanguageName = preferredLanguage === 'as' ? 'Assamese (অসমীয়া)' : 'Bengali (বাংলা)';
  } else if (/[\u0B80-\u0BFF]/.test(rawText)) {
    detectedLanguage = 'ta';
    detectedLanguageName = 'Tamil (தமிழ்)';
  } else if (/[\u0C00-\u0C7F]/.test(rawText)) {
    detectedLanguage = 'te';
    detectedLanguageName = 'Telugu (తెలుగు)';
  } else if (/[\u0C80-\u0CFF]/.test(rawText)) {
    detectedLanguage = 'kn';
    detectedLanguageName = 'Kannada (ಕನ್ನಡ)';
  } else if (/[\u0D00-\u0D7F]/.test(rawText)) {
    detectedLanguage = 'ml';
    detectedLanguageName = 'Malayalam (മലയാളം)';
  } else if (/[\u0A80-\u0AFF]/.test(rawText)) {
    detectedLanguage = 'gu';
    detectedLanguageName = 'Gujarati (ગુજરાતી)';
  } else if (/[\u0B00-\u0B7F]/.test(rawText)) {
    detectedLanguage = 'or';
    detectedLanguageName = 'Odia (ଓଡ଼ିଆ)';
  } else if (/[\u0A00-\u0A7F]/.test(rawText)) {
    detectedLanguage = 'pa';
    detectedLanguageName = 'Punjabi (ਪੰਜਾਬੀ)';
  } else if (/[\u0600-\u06FF]/.test(rawText)) {
    detectedLanguage = 'ur';
    detectedLanguageName = 'Urdu (اُردُو)';
  } else if (preferredLanguage && preferredLanguage !== 'en') {
    detectedLanguage = preferredLanguage;
    detectedLanguageName = preferredLanguage.toUpperCase();
  }

  const isEmergency = rawText.toLowerCase().includes('spark') ||
    rawText.toLowerCase().includes('shock') ||
    rawText.toLowerCase().includes('current') ||
    rawText.toLowerCase().includes('fire') ||
    rawText.toLowerCase().includes('danger') ||
    rawText.toLowerCase().includes('आग') ||
    rawText.toLowerCase().includes('शॉक');

  let defaultDemoContent = rawText;
  if (!defaultDemoContent) {
    if (fileSummaries.some(f => f.type === 'audio')) {
      defaultDemoContent = 'शिवाजी नगर बस स्थानकाजवळ विजेच्या उघड्या तारा आहेत. पावसात शॉक लागण्याची भीती आहे. कृपया तातडीने दुरुस्त करा.';
      detectedLanguage = 'mr';
      detectedLanguageName = 'Marathi (मराठी)';
    } else {
      defaultDemoContent = 'Severe road damage and pothole causing vehicle skidding during evening traffic peak.';
    }
  }

  // Create realistic image observations for uploaded images in demo mode
  const imageObservations: ImageObservation[] = mediaFiles
    .filter(f => f.type.startsWith('image'))
    .map(f => ({
      fileName: f.name,
      visibleDetails: 'Visible asphalt depression approximately 50-60cm wide with exposed aggregate and road erosion.',
      extractedText: 'Road caution indicator nearby',
      sourceOfObservation: 'direct_image_analysis',
    }));

  return {
    success: true,
    extractedText: defaultDemoContent,
    originalTranscript: fileSummaries.some(f => f.type === 'audio') ? defaultDemoContent : undefined,
    translatedText: (hasMarathi || hasHindi) ? 'Near Shivaji Nagar bus stand, open electric wires are exposed. High risk of electric shock during rains. Please repair urgently.' : undefined,
    detectedLanguage,
    detectedLanguageName,
    languageConfidence: 'high',
    warnings: [
      'Demo Mode: Using local offline extraction simulator. Configure GEMINI_API_KEY in .env.local for live Google Gemini processing.',
    ],
    processedFiles: fileSummaries,
    imageObservations,
    isEmergencyAlert: isEmergency,
    isDemoMode: true,
  };
}
