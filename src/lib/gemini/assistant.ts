import { GoogleGenAI } from '@google/genai';
import { getGeminiClient, SUPPORTED_MODELS } from './client';
import { reportRepository } from '../storage/repository';
import { formatUntrustedContent } from '../utils/sanitizer';

import { SignalReport } from '../schemas/report';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  relatedReportId?: string;
  actionSuggestion?: {
    type: 'navigate_report' | 'fill_category' | 'view_map';
    payload: string;
  };
}

export interface AssistantChatRequest {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  currentReportId?: string;
  userBackupApiKey?: string;
  preferredLanguage?: string;
}

export interface AssistantChatResponse {
  reply: string;
  suggestedPrompts: string[];
  referencedReport?: {
    id: string;
    title: string;
    status: string;
    urgency: string;
    locality?: string;
  };
}

export async function processAssistantMessage(
  request: AssistantChatRequest,
  userId?: string
): Promise<AssistantChatResponse> {
  const {
    message,
    history = [],
    currentReportId,
    userBackupApiKey,
    preferredLanguage = 'en',
  } = request;

  // Retrieve authorized reports for context (Pune local focus & pan-India)
  const userReports = userId ? reportRepository.getUserReports(userId) : [];
  const rawTarget = currentReportId ? reportRepository.getById(currentReportId) : null;

  // Strict Server-Side Authorization: targetReport can only be accessed if
  // 1) Current caller is verified owner, OR
  // 2) The report is explicitly approved public AND not private/medical
  const isOwner = Boolean(rawTarget && userId && rawTarget.userId === userId);
  const isAllowedPublic = Boolean(
    rawTarget &&
    rawTarget.publicVisibility === 'approved' &&
    rawTarget.category !== 'medical_health_records'
  );
  const targetReport: SignalReport | null = (isOwner || isAllowedPublic) ? rawTarget : null;

  // Check Gemini resolution
  const clientResolution = getGeminiClient(userBackupApiKey);

  // If Gemini client is unavailable, generate a smart context response
  if (!clientResolution.ai) {
    return generateDemoAssistantReply(message, userReports, targetReport, preferredLanguage);
  }

  const ai = clientResolution.ai;

  const systemPrompt = `
You are the SignalBridge Civic AI Assistant - an intelligent, life-saving assistant specifically focused on civic, traffic, weather, news verification, and public infrastructure assistance across India (featuring active live pilot telemetry in Pune, especially Kalyani Nagar, Viman Nagar, Koregaon Park, and Shivaji Nagar).

Core Capabilities:
1. Help users categorize and file structured reports across all 6 problem domains anywhere in India:
   - Traffic & Road Safety (Car crashes, road blockages, traffic light faults)
   - Civic Infrastructure (Potholes, exposed live wires, drainage, water leaks)
   - Weather & Environmental Hazard (Floods, storms, extreme weather alerts)
   - News & Public Information (Fact-checking local rumors, official civic advisories)
   - Photos, Screenshots & Document Intelligence (Deciphering official notices, stamps across Indian scripts)
   - Medical History & Health Records (Chronological health record organization, consultation preparation - strictly advisory, never diagnose or prescribe)
2. Retrieve and explain the user's saved reports accurately without fabricating facts.
3. If an urgent hazard is described (e.g. car crash in Kalyani Nagar with road blockage, live wires in Shivaji Nagar, or hazards in any Indian city), provide immediate safety guidance with official emergency helplines:
   - National Emergency (Police / Fire / Ambulance): 112 (ERSS)
   - Ambulance / Medical: 108
   - National Power Helpline: 1912
   - Municipal / Local Disaster Cells (e.g., Pune Traffic Control 020-26122880 / PMC Disaster Cell 020-25501269 for the Pune pilot area)
4. Keep replies clear, empathetic, and actionable. Avoid unnecessary fluff.
5. If the user asks in any of the 22 Scheduled Indian Languages (Marathi, Hindi, Tamil, Telugu, Bengali, Gujarati, Kannada, etc.), reply in that language or English as requested.

User Context:
- Active User Submissions Count: ${userReports.length}
- User's Reports: ${JSON.stringify(userReports.map(r => ({ id: r.id, title: r.title, status: r.status, locality: r.location?.locality, urgency: r.urgency })))}
- Currently Selected Report: ${targetReport ? JSON.stringify({ id: targetReport.id, title: targetReport.title, status: targetReport.status, summary: targetReport.summary }) : 'None'}
`;

  const contents: Array<{ text: string }> = [
    { text: systemPrompt },
  ];

  // Add conversation history
  for (const h of history.slice(-6)) {
    contents.push({
      text: `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`,
    });
  }

  // Add latest user message
  contents.push({
    text: `User query: ${formatUntrustedContent(message, 'user_chat_query')}`,
  });

  let rawReply = '';
  let lastError: unknown = null;

  for (const modelName of SUPPORTED_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model: modelName,
        contents,
      });
      if (res.text) {
        rawReply = res.text.trim();
        break;
      }
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Assistant model ${modelName} failed, trying fallback:`, msg);
    }
  }

  if (!rawReply && lastError) {
    // If live call fails, fallback gracefully to contextual offline response
    return generateDemoAssistantReply(message, userReports, targetReport, preferredLanguage);
  }

  return {
    reply: rawReply || 'I am ready to help you analyze community issues or manage your reports in Pune.',
    suggestedPrompts: getSuggestedPrompts(message, userReports),
    referencedReport: targetReport
      ? {
          id: targetReport.id,
          title: targetReport.title,
          status: targetReport.status,
          urgency: targetReport.urgency,
          locality: targetReport.location?.locality,
        }
      : undefined,
  };
}

function generateDemoAssistantReply(
  query: string,
  userReports: SignalReport[],
  targetReport: SignalReport | null,
  lang: string
): AssistantChatResponse {
  const q = query.toLowerCase();

  if (q.includes('kalyani nagar') || q.includes('crash') || q.includes('traffic') || q.includes('blockage') || q.includes('accident')) {
    return {
      reply: 'There is an escalating critical road blockage reported at Kalyani Nagar junction on Central Avenue due to a multi-vehicle car collision. Both lanes are currently obstructed with minor fluid spillage. Pune Traffic Police (Yerwada Division) and towing units have been notified. Commuters are advised to divert via Koregaon Park or North Main Road.',
      suggestedPrompts: [
        'How do I report a traffic hazard?',
        'Show emergency helpline numbers for Pune',
        'Check status of Kalyani Nagar report',
      ],
      referencedReport: {
        id: 'sb-pune-001',
        title: 'Severe road blockage due to multi-vehicle car crash at Kalyani Nagar junction',
        status: 'under_review',
        urgency: 'critical',
        locality: 'Kalyani Nagar, Pune',
      },
    };
  }

  if (q.includes('my report') || q.includes('status') || q.includes('previous')) {
    if (userReports.length > 0) {
      const latest = userReports[0];
      return {
        reply: `You currently have ${userReports.length} report(s) on record. Your latest submission is "${latest.title}" (Status: ${latest.status}, Urgency: ${latest.urgency}). You can review all details on the "My Reports" page.`,
        suggestedPrompts: [
          'How do I delete or edit my report?',
          'How long does verification take?',
          'View on Live Map',
        ],
        referencedReport: {
          id: latest.id,
          title: latest.title,
          status: latest.status,
          urgency: latest.urgency,
          locality: latest.location?.locality,
        },
      };
    }
    return {
      reply: 'You have not submitted any reports yet in this session. You can submit one by typing your complaint, speaking live in Marathi/Hindi/English, or uploading a photograph.',
      suggestedPrompts: [
        'Report a pothole or road hazard',
        'How does voice transcription work?',
        'What categories are supported?',
      ],
    };
  }

  if (q.includes('emergency') || q.includes('wire') || q.includes('electric') || q.includes('shock')) {
    return {
      reply: 'For immediate life-threatening physical hazards (such as live exposed wires or active fires in Pune), please maintain a 15-foot safety distance and call Pune Emergency Dispatch 112 or MSEDCL 24x7 Helpline 1912 immediately.',
      suggestedPrompts: [
        'Report an electrical hazard in Pune',
        'PMC Disaster Cell contacts',
        'Check Shivaji Nagar report',
      ],
    };
  }

  if (q.includes('category') || q.includes('domain') || q.includes('what can i report')) {
    return {
      reply: 'SignalBridge supports 6 comprehensive problem domains:\n1. Traffic & Road Safety (Car crashes, road blockages, potholes)\n2. Civic Infrastructure (Live wires, drainage, water pipeline leaks)\n3. Weather & Environmental Alerts (Flooding, heavy rains, tree falls)\n4. News & Public Information / Fact-Check (Rumors, official notices)\n5. Document Intelligence (Photographed notices, government stamps)\n6. Medical History & Health Records (Organizing prescriptions and lab chronologies)',
      suggestedPrompts: [
        'Report a car crash in Kalyani Nagar',
        'How to upload photos for OCR?',
        'How does speech-to-text work?',
      ],
    };
  }

  return {
    reply: 'I am the SignalBridge Civic AI Assistant for India. I can help you document community issues, check traffic hazards like the Kalyani Nagar road blockage pilot incident, track your saved reports, or guide you through multilingual speech reporting.',
    suggestedPrompts: [
      'What is happening in Kalyani Nagar?',
      'Check status of my reports',
      'What categories can I report?',
      'National emergency helpline numbers',
    ],
  };
}

function getSuggestedPrompts(message: string, userReports: SignalReport[]): string[] {
  return [
    'Check Kalyani Nagar road blockage update',
    'How do I file a traffic hazard report?',
    'What emergency numbers exist in India?',
    userReports.length > 0 ? 'Review my saved reports' : 'Explain supported report categories',
  ];
}
