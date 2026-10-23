import { z } from 'zod';

/**
 * SignalBridge Canonical Report Schema
 * Validated via Zod on both client and server to guarantee consistency.
 */

export const ProvenanceEnum = z.enum([
  'user_reported',
  'extracted_from_source',
  'independently_verified',
  'needs_confirmation',
]);
export type Provenance = z.infer<typeof ProvenanceEnum>;

export const CategoryEnum = z.enum([
  'traffic_road_safety',
  'civic_infrastructure',
  'weather_environment',
  'news_public_info',
  'photo_document_verification',
  'medical_health_records',
  'document_public_service', // backward compatibility
  'other',
]);
export type ReportCategory = z.infer<typeof CategoryEnum>;

export const UrgencyEnum = z.enum([
  'critical',
  'high',
  'medium',
  'low',
  'needs_review',
]);
export type UrgencyLevel = z.infer<typeof UrgencyEnum>;

export const WorkflowStatusEnum = z.enum([
  'submitted',
  'under_review',
  'verified',
  'action_taken',
  'resolved',
  'rejected',
]);
export type WorkflowStatus = z.infer<typeof WorkflowStatusEnum>;

export const VisibilityEnum = z.enum([
  'approved',
  'pending',
  'private',
  'rejected',
]);
export type VisibilityStatus = z.infer<typeof VisibilityEnum>;

export const FactItemSchema = z.object({
  id: z.string(),
  statement: z.string().min(1),
  provenance: ProvenanceEnum,
  sourceReference: z.string().optional(),
});
export type FactItem = z.infer<typeof FactItemSchema>;

export const EntityItemSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['location', 'department', 'person', 'document', 'date', 'contact', 'other']),
  value: z.string().min(1),
});
export type EntityItem = z.infer<typeof EntityItemSchema>;

export const LocationInfoSchema = z.object({
  rawInput: z.string().optional(),
  locality: z.string(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
  approximateCoordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  isApproximate: z.boolean().default(true),
});
export type LocationInfo = z.infer<typeof LocationInfoSchema>;

export const EvidenceItemSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileType: z.enum(['image', 'audio', 'document', 'text', 'url']),
  fileSize: z.number().optional(),
  extractedSnippet: z.string().optional(),
  isVerifiedContent: z.boolean().default(false),
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export const ImageObservationSchema = z.object({
  fileName: z.string(),
  visibleDetails: z.string(),
  extractedText: z.string().optional(),
  sourceOfObservation: z.string().default('direct_image_analysis'),
});
export type ImageObservation = z.infer<typeof ImageObservationSchema>;

export const VerificationStatusSchema = z.object({
  isIndependentlyVerified: z.boolean().default(false),
  verificationNote: z.string(),
  sourcesChecked: z.array(z.string()).default([]),
  unverifiedClaims: z.array(z.string()).default([]),
  verifiedAt: z.string().optional(),
});
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const RecommendedActionSchema = z.object({
  id: z.string(),
  title: z.string(),
  targetEntity: z.string().optional(),
  portalOrDesk: z.string().optional(),
  steps: z.array(z.string()),
  prerequisites: z.array(z.string()).default([]),
  emergencyNote: z.string().optional(),
  actionType: z.enum(['portal_submission', 'phone_inquiry', 'document_prep', 'emergency_contact', 'other']).default('other'),
});
export type RecommendedAction = z.infer<typeof RecommendedActionSchema>;

export const SignalReportSchema = z.object({
  id: z.string(),
  userId: z.string().optional(), // Persistent guest or user identity
  title: z.string().min(1),
  summary: z.string().min(1),
  category: CategoryEnum,
  sourceLanguage: z.string().default('en'),
  detectedLanguageName: z.string().optional(),
  preferredResponseLanguage: z.string().default('en'),
  status: WorkflowStatusEnum.default('submitted'),
  urgency: UrgencyEnum.default('needs_review'),
  isEmergency: z.boolean().default(false),
  emergencyAdvisory: z.string().optional(),
  rawTranscript: z.string().optional(), // Verbatim original speech record
  translatedText: z.string().optional(), // Explicit separate translation if applicable
  imageObservations: z.array(ImageObservationSchema).optional(),
  facts: z.array(FactItemSchema).default([]),
  entities: z.array(EntityItemSchema).default([]),
  location: LocationInfoSchema.optional(),
  incidentDate: z.string().optional(),
  evidence: z.array(EvidenceItemSchema).default([]),
  missingInformation: z.array(z.string()).default([]),
  contradictions: z.array(z.string()).default([]),
  verification: VerificationStatusSchema,
  recommendedActions: z.array(RecommendedActionSchema).default([]),
  publicVisibility: VisibilityEnum.default('pending'),
  isDemoData: z.boolean().default(false),
  deleteSecret: z.string().optional(), // Used for self-service user deletion
  adminNotes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SignalReport = z.infer<typeof SignalReportSchema>;

/**
 * Public-safe report schema: strips internal admin notes and deletion secrets,
 * and ensures approximate location is used.
 */
export const PublicSafeReportSchema = SignalReportSchema.omit({
  deleteSecret: true,
  adminNotes: true,
});
export type PublicSafeReport = z.infer<typeof PublicSafeReportSchema>;

/**
 * Stage A Extraction Request & Response Schema
 */
export const ExtractionRequestSchema = z.object({
  text: z.string().optional(),
  mediaFiles: z.array(z.object({
    name: z.string(),
    type: z.string(),
    base64Data: z.string(),
    size: z.number(),
  })).default([]),
  preferredLanguage: z.string().default('en'),
  userBackupApiKey: z.string().optional(),
});
export type ExtractionRequest = z.infer<typeof ExtractionRequestSchema>;

export const ExtractionResponseSchema = z.object({
  success: z.boolean(),
  extractedText: z.string(),
  originalTranscript: z.string().optional(),
  translatedText: z.string().optional(),
  detectedLanguage: z.string(),
  detectedLanguageName: z.string(),
  languageConfidence: z.enum(['high', 'medium', 'low', 'unknown']),
  warnings: z.array(z.string()),
  processedFiles: z.array(z.object({
    name: z.string(),
    type: z.string(),
    summary: z.string(),
  })),
  imageObservations: z.array(ImageObservationSchema).default([]),
  isEmergencyAlert: z.boolean(),
  isDemoMode: z.boolean(),
});
export type ExtractionResponse = z.infer<typeof ExtractionResponseSchema>;

/**
 * Stage B Analysis Request Schema
 */
export const AnalysisRequestSchema = z.object({
  reviewedText: z.string().min(1, 'Please provide or review the issue description.'),
  rawTranscript: z.string().optional(),
  categoryHint: CategoryEnum.optional(),
  locationHint: z.string().optional(),
  preferredResponseLanguage: z.string().default('en'),
  evidenceSummaries: z.array(z.object({
    name: z.string(),
    type: z.enum(['image', 'audio', 'document', 'text', 'url']),
    snippet: z.string().optional(),
  })).default([]),
  imageObservations: z.array(ImageObservationSchema).optional(),
  userBackupApiKey: z.string().optional(),
});
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

/**
 * Lightweight Achievement Schema
 */
export const AchievementTierSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  requiredCount: z.number(),
  unlocked: z.boolean(),
  icon: z.string(),
});
export type AchievementTier = z.infer<typeof AchievementTierSchema>;

export const UserAchievementsSchema = z.object({
  totalSubmissions: z.number(),
  achievements: z.array(AchievementTierSchema),
  nextMilestone: AchievementTierSchema.optional(),
  progressToNext: z.number(), // 0 - 100
});
export type UserAchievements = z.infer<typeof UserAchievementsSchema>;
