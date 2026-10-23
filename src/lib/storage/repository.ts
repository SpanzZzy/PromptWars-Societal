import fs from 'fs';
import path from 'path';
import { SignalReport, SignalReportSchema, PublicSafeReport, PublicSafeReportSchema } from '../schemas/report';
import { SEED_REPORTS } from './seedData';

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'reports.json');

class ReportRepository {
  private inMemoryReports: Map<string, SignalReport> = new Map();
  private isInitialized = false;

  private ensureDirectory() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch {
      // In restricted or serverless environments, file persistence will gracefully fall back to memory
    }
  }

  private init() {
    if (this.isInitialized) return;
    this.ensureDirectory();

    let loaded = false;
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const item of parsed) {
            const valid = SignalReportSchema.safeParse(item);
            if (valid.success) {
              this.inMemoryReports.set(valid.data.id, valid.data);
            }
          }
          loaded = this.inMemoryReports.size > 0;
        }
      }
    } catch {
      // ignore read error and fall back to seed
    }

    if (!loaded) {
      // Seed with initial high-quality records
      for (const item of SEED_REPORTS) {
        this.inMemoryReports.set(item.id, { ...item });
      }
      this.persist();
    }

    this.isInitialized = true;
  }

  private persist() {
    try {
      this.ensureDirectory();
      const all = Array.from(this.inMemoryReports.values());
      fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), 'utf-8');
    } catch {
      // Fallback silently to memory
    }
  }

  public getAll(options?: {
    includePrivate?: boolean;
    category?: string;
    status?: string;
    urgency?: string;
    limit?: number;
    offset?: number;
  }): SignalReport[] {
    this.init();
    let reports = Array.from(this.inMemoryReports.values());

    if (!options?.includePrivate) {
      // In public listings, ONLY approved reports, and strictly exclude medical records to protect patient confidentiality
      reports = reports.filter(r => r.publicVisibility === 'approved' && r.category !== 'medical_health_records');
    }
    if (options?.category && options.category !== 'all') {
      reports = reports.filter(r => r.category === options.category);
    }
    if (options?.status && options.status !== 'all') {
      reports = reports.filter(r => r.status === options.status);
    }
    if (options?.urgency && options.urgency !== 'all') {
      reports = reports.filter(r => r.urgency === options.urgency);
    }

    // Sort newest first
    const sorted = reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const offset = Math.max(0, options?.offset ?? 0);
    const limit = options?.limit !== undefined ? Math.min(Math.max(1, options.limit), 500) : 500;
    return sorted.slice(offset, offset + limit);
  }

  public getPublicReports(options?: { category?: string; status?: string; limit?: number; offset?: number }): PublicSafeReport[] {
    const reports = this.getAll({
      includePrivate: false,
      category: options?.category,
      status: options?.status,
      limit: options?.limit,
      offset: options?.offset,
    });

    return reports.map(r => {
      // Safe transformation
      const { deleteSecret: _, adminNotes: __, ...safe } = r;
      // Guarantee location coordinates are approximate
      if (safe.location) {
        safe.location.isApproximate = true;
      }
      return safe as PublicSafeReport;
    });
  }

  public getUserReports(userId: string): SignalReport[] {
    this.init();
    if (!userId) return [];
    const reports = Array.from(this.inMemoryReports.values()).filter(
      (r) => r.userId === userId && !r.isDemoData
    );
    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getUserSubmissionCount(userId: string): number {
    this.init();
    if (!userId) return 0;
    return Array.from(this.inMemoryReports.values()).filter(
      (r) => r.userId === userId && !r.isDemoData
    ).length;
  }

  public getById(id: string): SignalReport | null {
    this.init();
    return this.inMemoryReports.get(id) || null;
  }

  public save(report: SignalReport): SignalReport {
    this.init();
    const validated = SignalReportSchema.parse(report);
    this.inMemoryReports.set(validated.id, validated);
    this.persist();
    return validated;
  }

  public update(id: string, updates: Partial<SignalReport>): SignalReport | null {
    this.init();
    const existing = this.inMemoryReports.get(id);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      createdAt: existing.createdAt, // Immutable creation time
      updatedAt: new Date().toISOString(),
    };

    const validated = SignalReportSchema.parse(merged);
    this.inMemoryReports.set(id, validated);
    this.persist();
    return validated;
  }

  public delete(
    id: string,
    options: { deleteSecret?: string; isAdmin?: boolean; userId?: string }
  ): boolean {
    this.init();
    const existing = this.inMemoryReports.get(id);
    if (!existing) return false;

    // Check authorization: Admin, matching secret, or matching owner userId
    const isOwner = Boolean(options.userId && existing.userId === options.userId);
    const hasValidSecret = Boolean(options.deleteSecret && existing.deleteSecret === options.deleteSecret);

    if (!options.isAdmin && !isOwner && !hasValidSecret) {
      return false;
    }

    const deleted = this.inMemoryReports.delete(id);
    if (deleted) {
      this.persist();
    }
    return deleted;
  }

  public getStats() {
    this.init();
    const all = Array.from(this.inMemoryReports.values());
    return {
      total: all.length,
      publicApproved: all.filter(r => r.publicVisibility === 'approved').length,
      pendingReview: all.filter(r => r.status === 'submitted' || r.status === 'under_review').length,
      resolved: all.filter(r => r.status === 'resolved').length,
      actionTaken: all.filter(r => r.status === 'action_taken').length,
      verified: all.filter(r => r.verification.isIndependentlyVerified).length,
      demographics: {
        civicInfrastructure: all.filter(r => r.category === 'civic_infrastructure').length,
        documentPublicService: all.filter(r => r.category === 'document_public_service').length,
        other: all.filter(r => r.category === 'other').length,
      },
      urgencyCounts: {
        critical: all.filter(r => r.urgency === 'critical').length,
        high: all.filter(r => r.urgency === 'high').length,
        medium: all.filter(r => r.urgency === 'medium').length,
        low: all.filter(r => r.urgency === 'low').length,
        needs_review: all.filter(r => r.urgency === 'needs_review').length,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  public resetToDemo(): void {
    this.inMemoryReports.clear();
    for (const item of SEED_REPORTS) {
      this.inMemoryReports.set(item.id, { ...item });
    }
    this.persist();
  }
}

// Global singleton instance for the server process
export const reportRepository = new ReportRepository();
