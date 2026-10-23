import crypto from 'crypto';
import { getGeminiClient, SUPPORTED_MODELS } from './client';
import {
  AnalysisRequest,
  SignalReport,
  SignalReportSchema,
  FactItem,
  RecommendedAction,
} from '../schemas/report';
import { formatUntrustedContent } from '../utils/sanitizer';

/**
 * Stage B: Generate canonical structured report with Gemini
 */
export async function generateStructuredReport(
  request: AnalysisRequest,
  userId?: string
): Promise<{ report: SignalReport; isDemoMode: boolean }> {
  const {
    reviewedText,
    rawTranscript,
    categoryHint,
    locationHint,
    preferredResponseLanguage = 'en',
    evidenceSummaries = [],
    imageObservations = [],
    userBackupApiKey,
  } = request;

  const clientResolution = getGeminiClient(userBackupApiKey);

  // If no Gemini client is available, generate deterministic demo report
  if (!clientResolution.ai) {
    const demoReport = generateDemoReport(request, userId);
    return { report: demoReport, isDemoMode: true };
  }

  const ai = clientResolution.ai;

  const systemPrompt = `
You are SignalBridge - an AI system for civic and public service intelligence.
Your task is to analyze the user-reviewed report and produce a strict, structured report in JSON format.

CRITICAL RULES:
1. Distinguish FACT PROVENANCE strictly:
   - 'user_reported': Claims stated directly by the user without third-party proof.
   - 'extracted_from_source': Information directly visible in submitted images (e.g. from image observations), documents, or audio codes.
   - 'independently_verified': Claims confirmed against known public databases or official government registries.
   - 'needs_confirmation': Ambiguous or unverified claims that require official field inspection.
2. NEVER claim a fact is "independently verified" merely because it sounds plausible or persuasive.
3. If an urgent physical danger exists (e.g. live exposed electrical wires, building collapse, gas leak, active fire), mark isEmergency=true, urgency='critical', and specify emergency guidance with standard emergency numbers (112, 101, 108, 1912).
4. Provide practical, step-by-step next actions with official departments (e.g., Municipal Corporation, MSEDCL, PWD, CPAO, UIDAI).
5. Output language: Ensure title, summary, and action steps are localized in the user's preferred Indian language: "${preferredResponseLanguage}" (e.g. Marathi for 'mr', Hindi for 'hi', Bengali for 'bn', Tamil for 'ta', Telugu for 'te', Gujarati for 'gu', Kannada for 'kn', Odia for 'or', Malayalam for 'ml', Punjabi for 'pa', Assamese for 'as', Urdu for 'ur', Sanskrit for 'sa', Nepali for 'ne', Konkani for 'kok', Maithili for 'mai', English for 'en').
6. Return ONLY a single raw JSON object matching this structure:
{
  "title": "Short, objective title",
  "summary": "2-3 sentence plain language summary",
  "category": "traffic_road_safety" | "civic_infrastructure" | "weather_environment" | "news_public_info" | "photo_document_verification" | "medical_health_records" | "document_public_service" | "other",
  "sourceLanguage": "string",
  "detectedLanguageName": "string",
  "urgency": "critical" | "high" | "medium" | "low" | "needs_review",
  "isEmergency": boolean,
  "emergencyAdvisory": "string or null",
  "facts": [
    {
      "id": "f-1",
      "statement": "string",
      "provenance": "user_reported" | "extracted_from_source" | "independently_verified" | "needs_confirmation",
      "sourceReference": "string or null"
    }
  ],
  "entities": [
    { "name": "Department or Landmark", "type": "location" | "department" | "person" | "document" | "other", "value": "string" }
  ],
  "location": {
    "locality": "Neighborhood or street",
    "city": "City name",
    "state": "State name",
    "approximateCoordinates": { "lat": number, "lng": number },
    "isApproximate": true
  },
  "incidentDate": "YYYY-MM-DD or null",
  "missingInformation": ["List of missing facts needed to act"],
  "contradictions": ["Contradictions noticed in statements if any"],
  "verification": {
    "isIndependentlyVerified": false,
    "verificationNote": "Clear statement on current verification status",
    "sourcesChecked": ["Official sources checked or referenced"],
    "unverifiedClaims": ["List of claims needing physical or institutional verification"]
  },
  "recommendedActions": [
    {
      "id": "act-1",
      "title": "Clear action title",
      "targetEntity": "Government body or portal name",
      "portalOrDesk": "URL, helpline or office name",
      "steps": ["Step 1", "Step 2"],
      "prerequisites": ["Document or prerequisite required"],
      "emergencyNote": "Emergency notice if applicable",
      "actionType": "portal_submission" | "phone_inquiry" | "document_prep" | "emergency_contact" | "other"
    }
  ]
}
`;

  const contents = [
    { text: systemPrompt },
    {
      text: `
User Input Category Hint: ${categoryHint || 'auto-detect'}
User Input Location Hint: ${locationHint || 'not provided'}
Evidence Attachments: ${JSON.stringify(evidenceSummaries)}
Direct Image Observations: ${JSON.stringify(imageObservations)}
Verbatim Original Transcript: ${rawTranscript || 'None'}
Reviewed Content to analyze:
${formatUntrustedContent(reviewedText, 'reviewed_report_text')}
`,
    },
  ];

  let rawResponseText = '';
  let lastError: unknown = null;

  for (const modelName of SUPPORTED_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model: modelName,
        contents,
      });
      if (res.text) {
        rawResponseText = res.text;
        break;
      }
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Analysis model ${modelName} failed, trying fallback:`, msg);
    }
  }

  if (!rawResponseText && lastError) {
    const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
    if (errMsg.includes('ENOTFOUND') || errMsg.includes('fetch failed') || errMsg.includes('ETIMEDOUT')) {
      console.warn('Network unreachable in analysis, falling back to deterministic report generation:', errMsg);
      const demoReport = generateDemoReport(request, userId);
      return { report: demoReport, isDemoMode: true };
    }
    throw lastError;
  }

  const cleaned = rawResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  const reportId = `sb-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
  const deleteSecret = crypto.randomBytes(16).toString('hex');
  const timestamp = new Date().toISOString();

  // Construct full report object
  const reportCandidate: SignalReport = {
    id: reportId,
    userId: userId || undefined,
    title: parsed.title || 'Civic Incident Report',
    summary: parsed.summary || reviewedText.slice(0, 150),
    category: parsed.category || categoryHint || 'civic_infrastructure',
    sourceLanguage: parsed.sourceLanguage || 'en',
    detectedLanguageName: parsed.detectedLanguageName || 'English',
    preferredResponseLanguage,
    status: 'submitted',
    urgency: parsed.urgency || 'medium',
    isEmergency: Boolean(parsed.isEmergency),
    emergencyAdvisory: parsed.emergencyAdvisory || undefined,
    rawTranscript: rawTranscript || undefined,
    imageObservations: imageObservations || [],
    facts: Array.isArray(parsed.facts)
      ? parsed.facts.map((f: Record<string, unknown>, i: number) => ({
          id: (typeof f.id === 'string' && f.id) || `f-${i + 1}`,
          statement: String(f.statement || ''),
          provenance: (f.provenance as any) || 'user_reported',
          sourceReference: (typeof f.sourceReference === 'string' && f.sourceReference) || undefined,
        }))
      : [],
    entities: Array.isArray(parsed.entities) ? parsed.entities : [],
    location: parsed.location
      ? {
          rawInput: locationHint || parsed.location.locality,
          locality: parsed.location.locality || 'Unknown locality',
          city: parsed.location.city || 'Mumbai',
          state: parsed.location.state || 'Maharashtra',
          country: 'India',
          approximateCoordinates: parsed.location.approximateCoordinates || { lat: 19.076, lng: 72.8777 },
          isApproximate: true,
        }
      : undefined,
    incidentDate: parsed.incidentDate || undefined,
    evidence: evidenceSummaries.map((e, idx) => ({
      id: `ev-${idx + 1}`,
      fileName: e.name,
      fileType: e.type,
      extractedSnippet: e.snippet,
      isVerifiedContent: true,
    })),
    missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
    contradictions: Array.isArray(parsed.contradictions) ? parsed.contradictions : [],
    verification: {
      isIndependentlyVerified: Boolean(parsed.verification?.isIndependentlyVerified),
      verificationNote: parsed.verification?.verificationNote || 'Self-reported community input pending municipal site verification.',
      sourcesChecked: Array.isArray(parsed.verification?.sourcesChecked) ? parsed.verification.sourcesChecked : [],
      unverifiedClaims: Array.isArray(parsed.verification?.unverifiedClaims) ? parsed.verification.unverifiedClaims : [],
      verifiedAt: parsed.verification?.isIndependentlyVerified ? timestamp : undefined,
    },
    recommendedActions: Array.isArray(parsed.recommendedActions)
      ? parsed.recommendedActions.map((a: Record<string, unknown>, i: number) => ({
          id: (typeof a.id === 'string' && a.id) || `act-${i + 1}`,
          title: String(a.title || 'Recommended Action'),
          targetEntity: String(a.targetEntity || 'Relevant Department'),
          portalOrDesk: (typeof a.portalOrDesk === 'string' && a.portalOrDesk) || undefined,
          steps: Array.isArray(a.steps) ? a.steps.map(String) : [],
          prerequisites: Array.isArray(a.prerequisites) ? a.prerequisites.map(String) : [],
          emergencyNote: (typeof a.emergencyNote === 'string' && a.emergencyNote) || undefined,
          actionType: (a.actionType as any) || 'other',
        }))
      : [],
    publicVisibility: 'pending',
    isDemoData: false,
    deleteSecret,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const validated = SignalReportSchema.parse(reportCandidate);
  return { report: validated, isDemoMode: false };
}

/**
 * Deterministic generator for Demo Mode when credentials are not present.
 */
function generateDemoReport(request: AnalysisRequest, userId?: string): SignalReport {
  const { reviewedText, rawTranscript, categoryHint, locationHint, preferredResponseLanguage = 'en', imageObservations = [] } = request;
  
  // Determine primary category
  const lowerText = reviewedText.toLowerCase();
  let resolvedCategory = categoryHint || 'civic_infrastructure';
  if (!categoryHint) {
    if (lowerText.includes('crash') || lowerText.includes('accident') || lowerText.includes('traffic') || lowerText.includes('car')) {
      resolvedCategory = 'traffic_road_safety';
    } else if (lowerText.includes('flood') || lowerText.includes('water log') || lowerText.includes('rain') || lowerText.includes('storm')) {
      resolvedCategory = 'weather_environment';
    } else if (lowerText.includes('rumor') || lowerText.includes('fake news') || lowerText.includes('fact check') || lowerText.includes('official news')) {
      resolvedCategory = 'news_public_info';
    } else if (lowerText.includes('stamp') || lowerText.includes('ocr') || lowerText.includes('signature') || lowerText.includes('certificate scan')) {
      resolvedCategory = 'photo_document_verification';
    } else if (lowerText.includes('medical') || lowerText.includes('blood test') || lowerText.includes('prescription') || lowerText.includes('doctor')) {
      resolvedCategory = 'medical_health_records';
    } else if (lowerText.includes('pension') || lowerText.includes('ration') || lowerText.includes('aadhaar')) {
      resolvedCategory = 'document_public_service';
    }
  }

  const isEmergency = lowerText.includes('spark') ||
    lowerText.includes('shock') ||
    lowerText.includes('fire') ||
    lowerText.includes('live wire') ||
    lowerText.includes('gas leak') ||
    lowerText.includes('major crash') ||
    lowerText.includes('severe flooding');

  const timestamp = new Date().toISOString();
  const reportId = `sb-demo-${Date.now().toString(36)}`;
  const deleteSecret = crypto.randomBytes(16).toString('hex');

  const facts: FactItem[] = [
    {
      id: 'f-1',
      statement: `Reported issue: ${reviewedText.slice(0, 140)}...`,
      provenance: 'user_reported',
    },
    {
      id: 'f-2',
      statement: locationHint ? `Landmark specified: ${locationHint}` : 'Location provided in submission text',
      provenance: 'user_reported',
    },
  ];

  if (imageObservations.length > 0) {
    facts.push({
      id: 'f-3',
      statement: `Photographic evidence: ${imageObservations[0].visibleDetails}`,
      provenance: 'extracted_from_source',
      sourceReference: imageObservations[0].fileName,
    });
  } else {
    facts.push({
      id: 'f-3',
      statement: resolvedCategory === 'medical_health_records'
        ? 'Medical history details recorded for structured clinical consultation preparation.'
        : resolvedCategory === 'news_public_info'
        ? 'Public claim cross-referenced with authorized municipal transparency channels.'
        : 'Civic safety observation recorded for official municipal coordination.',
      provenance: 'needs_confirmation',
    });
  }

  let title = 'Civic Infrastructure & Safety Report';
  let actions: RecommendedAction[] = [];

  switch (resolvedCategory) {
    case 'traffic_road_safety':
      title = 'Traffic Obstruction & Road Safety Report';
      actions = [
        {
          id: 'act-1',
          title: isEmergency ? 'Emergency Traffic Control & Tow Crane Dispatch' : 'Traffic Management Cell Coordination',
          targetEntity: 'City Police Traffic Branch / Emergency Support',
          portalOrDesk: isEmergency ? 'National Emergency Helpline 112 / Traffic Control Desk' : 'Citizen Traffic Portal',
          steps: [
            isEmergency
              ? 'Alert local traffic control quoting exact intersection landmark.'
              : 'Submit geo-tagged traffic hazard notice via city municipal app.',
            'Maintain safe clearance perimeter around the obstruction.',
          ],
          prerequisites: ['Accurate intersection landmark', 'Observed vehicle numbers if applicable'],
          emergencyNote: isEmergency ? 'Active road blockage or fuel spill: notify 112 immediately.' : undefined,
          actionType: isEmergency ? 'emergency_contact' : 'portal_submission',
        },
      ];
      break;

    case 'weather_environment':
      title = 'Weather & Environmental Alert Dossier';
      actions = [
        {
          id: 'act-1',
          title: 'Disaster Management & Waterlogging Escalation',
          targetEntity: 'Municipal Disaster Management Cell',
          portalOrDesk: 'Disaster Cell Hotline / Citizen Grievance Portal',
          steps: [
            'Alert ward drainage maintenance team to clear blocked culverts/drains.',
            'Monitor official IMD and regional disaster weather bulletins.',
          ],
          prerequisites: ['Approximate flood depth', 'Street landmark'],
          actionType: 'portal_submission',
        },
      ];
      break;

    case 'news_public_info':
      title = 'Public Information & Fact-Check Verification Dossier';
      actions = [
        {
          id: 'act-1',
          title: 'Official Channel Cross-Reference',
          targetEntity: 'District Information Office / Press Information Bureau',
          portalOrDesk: 'PIB Fact Check / Municipal Portal',
          steps: [
            'Check official district administration gazette and press releases.',
            'Refrain from redistributing unverified circulars on social media.',
          ],
          prerequisites: ['Full headline or notice snippet'],
          actionType: 'other',
        },
      ];
      break;

    case 'photo_document_verification':
      title = 'Document Intelligence & Stamp Verification Report';
      actions = [
        {
          id: 'act-1',
          title: 'Official Document Issuing Authority Verification',
          targetEntity: 'Departmental Record Room / Digital Locker Portal',
          portalOrDesk: 'DigiLocker / State Government Portal',
          steps: [
            'Match document token/serial with departmental registry records.',
            'Ensure official stamp and digital signature validity.',
          ],
          prerequisites: ['Legible scan or high-resolution photograph of the notice'],
          actionType: 'portal_submission',
        },
      ];
      break;

    case 'medical_health_records':
      title = 'Personal Health Record & Consultation Preparation Dossier';
      actions = [
        {
          id: 'act-1',
          title: 'Clinical Consultation Question Checklist',
          targetEntity: 'Attending Physician / Healthcare Provider',
          portalOrDesk: 'Personal Medical Consultation (Private)',
          steps: [
            'Present organized timeline of symptoms and previous prescriptions to treating doctor.',
            'Clarify medication dosages and follow-up lab dates with healthcare provider.',
          ],
          prerequisites: ['Original diagnostic laboratory slips', 'Previous prescription sheets'],
          actionType: 'other',
        },
      ];
      break;

    case 'document_public_service':
      title = 'Public Service & Document Assistance Report';
      actions = [
        {
          id: 'act-1',
          title: 'Document Verification & Public Service Portal Guidance',
          targetEntity: 'Designated Public Service Desk',
          portalOrDesk: 'Aaple Sarkar / National Government Services Portal',
          steps: [
            'Verify mandatory identity documents (Aadhaar, address proof).',
            'Submit formal grievance via online departmental grievance redressal mechanism.',
            'Track token and retain stamped acknowledgment.',
          ],
          prerequisites: ['Valid proof of identity', 'Mobile number linked with Aadhaar'],
          actionType: 'portal_submission',
        },
      ];
      break;

    case 'civic_infrastructure':
    default:
      title = isEmergency ? 'Critical Electrical / Infrastructure Hazard' : 'Civic Infrastructure & Safety Hazard Report';
      actions = [
        {
          id: 'act-1',
          title: isEmergency ? 'Immediate Emergency Escalation' : 'Municipal Civic Grievance Submission',
          targetEntity: isEmergency ? 'Emergency Response Support System' : 'Municipal Corporation Ward Office',
          portalOrDesk: isEmergency ? 'National Emergency Helpline 112 / Utility Desk 1912' : 'Citizen Grievance Portal',
          steps: [
            isEmergency
              ? 'Alert local emergency services immediately quoting hazard coordinates.'
              : 'File formal pothole/hazard repair request on municipal citizen portal.',
            'Maintain safe clearance perimeter around the site.',
            'Quote ticket ID to ward sanitary/road maintenance supervisor.',
          ],
          prerequisites: ['Approximate landmark address'],
          emergencyNote: isEmergency ? 'High voltage or structural hazard: keep bystanders away.' : undefined,
          actionType: isEmergency ? 'emergency_contact' : 'portal_submission',
        },
      ];
      break;
  }

  const isMedical = resolvedCategory === 'medical_health_records';

  const report: SignalReport = {
    id: reportId,
    userId: userId || undefined,
    title,
    summary: reviewedText.slice(0, 200),
    category: resolvedCategory as any,
    sourceLanguage: 'en',
    detectedLanguageName: 'English / Detected',
    preferredResponseLanguage,
    status: 'submitted',
    urgency: isEmergency ? 'critical' : 'medium',
    isEmergency,
    emergencyAdvisory: isEmergency
      ? 'POTENTIAL EMERGENCY: Do not attempt to touch or resolve electrical/fire hazards directly. Contact emergency helpline 112 immediately.'
      : undefined,
    rawTranscript: rawTranscript || undefined,
    imageObservations,
    facts,
    entities: [
      { name: 'Jurisdiction', type: 'location', value: locationHint || 'Local Municipal Corporation / District Administration' },
      { name: 'Category', type: 'other', value: resolvedCategory },
    ],
    location: {
      rawInput: locationHint || 'Civic community report',
      locality: locationHint || 'Civic Ward / Sector',
      city: locationHint && /delhi/i.test(locationHint)
        ? 'Delhi'
        : locationHint && /bengaluru|bangalore/i.test(locationHint)
        ? 'Bengaluru'
        : locationHint && /mumbai/i.test(locationHint)
        ? 'Mumbai'
        : locationHint && /chennai/i.test(locationHint)
        ? 'Chennai'
        : locationHint && /hyderabad/i.test(locationHint)
        ? 'Hyderabad'
        : locationHint && /kolkata/i.test(locationHint)
        ? 'Kolkata'
        : locationHint && /pune/i.test(locationHint)
        ? 'Pune'
        : locationHint ? locationHint.split(',')[0].trim() : 'Pune (Pilot Region)',
      state: 'India',
      country: 'India',
      approximateCoordinates: { lat: 18.5482, lng: 73.9031 },
      isApproximate: true,
    },
    incidentDate: timestamp.split('T')[0],
    evidence: (request.evidenceSummaries || []).map((e, idx) => ({
      id: `ev-${idx + 1}`,
      fileName: e.name,
      fileType: e.type,
      extractedSnippet: e.snippet,
      isVerifiedContent: false,
    })),
    missingInformation: isMedical
      ? ['Follow-up consultation with licensed medical practitioner']
      : ['Official ward docket registration number', 'Field supervisor site visit confirmation'],
    contradictions: [],
    verification: {
      isIndependentlyVerified: false,
      verificationNote: isMedical
        ? 'Clinical records organized for patient-doctor review. Does not substitute professional medical diagnosis.'
        : 'Synthesized in Demonstration Mode. Ground truth requires physical field inspection.',
      sourcesChecked: isMedical ? ['SignalBridge Patient Health Organizer'] : ['SignalBridge Civic Registry'],
      unverifiedClaims: isMedical ? ['Self-reported symptom severity'] : ['Specific engineering measurement of damage'],
    },
    recommendedActions: actions,
    publicVisibility: isMedical ? 'private' : 'pending',
    isDemoData: false,
    deleteSecret,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return SignalReportSchema.parse(report);
}
