import { NextRequest, NextResponse } from 'next/server';
import { processAssistantMessage } from '@/lib/gemini/assistant';
import { getOrCreateUserId, USER_ID_COOKIE_NAME, USER_ID_COOKIE_MAX_AGE } from '@/lib/auth/userSession';
import { isEligibleForBackupKey } from '@/lib/gemini/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, currentReportId, userBackupApiKey, preferredLanguage } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const { userId, isNew } = await getOrCreateUserId();

    const result = await processAssistantMessage(
      {
        message: message.trim(),
        history,
        currentReportId,
        userBackupApiKey,
        preferredLanguage,
      },
      userId
    );

    const response = NextResponse.json({
      success: true,
      reply: result.reply,
      suggestedPrompts: result.suggestedPrompts,
      referencedReport: result.referencedReport,
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
    console.error('Assistant API error:', err);
    const eligible = isEligibleForBackupKey(err);
    return NextResponse.json(
      {
        error: err.message || 'Assistant response failed',
        eligibleForBackupKey: eligible,
      },
      { status: eligible ? 403 : 500 }
    );
  }
}
