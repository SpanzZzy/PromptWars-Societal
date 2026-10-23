import { NextRequest, NextResponse } from 'next/server';
import { generateStructuredReport } from '@/lib/gemini/analysis';
import { AnalysisRequestSchema } from '@/lib/schemas/report';
import { reportRepository } from '@/lib/storage/repository';
import { isEligibleForBackupKey } from '@/lib/gemini/client';
import {
  getOrCreateUserId,
  USER_ID_COOKIE_NAME,
  USER_ID_COOKIE_MAX_AGE,
} from '@/lib/auth/userSession';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = AnalysisRequestSchema.parse(body);

    const { userId, isNew } = await getOrCreateUserId();
    const { report, isDemoMode } = await generateStructuredReport(validated, userId);

    // Persist to store
    reportRepository.save(report);

    const response = NextResponse.json({
      success: true,
      report,
      isDemoMode,
      deleteSecret: report.deleteSecret,
      userId,
    });

    if (isNew) {
      response.cookies.set({
        name: USER_ID_COOKIE_NAME,
        value: userId,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: USER_ID_COOKIE_MAX_AGE,
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return response;
  } catch (err: any) {
    console.error('Analysis error:', err);
    const eligible = isEligibleForBackupKey(err);
    const message = err?.message || 'Failed to complete structured Gemini analysis.';

    return NextResponse.json(
      {
        error: message,
        eligibleForBackupKey: eligible,
      },
      { status: eligible ? 403 : 500 }
    );
  }
}
