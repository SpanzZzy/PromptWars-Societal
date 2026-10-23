import { NextRequest, NextResponse } from 'next/server';
import { reportRepository } from '@/lib/storage/repository';
import {
  getOrCreateUserId,
  calculateUserAchievements,
  USER_ID_COOKIE_NAME,
  USER_ID_COOKIE_MAX_AGE,
} from '@/lib/auth/userSession';

export async function GET(req: NextRequest) {
  try {
    const { userId, isNew } = await getOrCreateUserId();
    const reports = reportRepository.getUserReports(userId);
    const submissionCount = reportRepository.getUserSubmissionCount(userId);
    const achievements = calculateUserAchievements(submissionCount);

    const response = NextResponse.json({
      userId,
      reports,
      count: reports.length,
      achievements,
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
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch personal reports' },
      { status: 500 }
    );
  }
}
