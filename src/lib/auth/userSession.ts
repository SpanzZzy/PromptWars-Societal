import crypto from 'crypto';
import { cookies } from 'next/headers';
import { UserAchievements, AchievementTier } from '../schemas/report';

export const USER_ID_COOKIE_NAME = 'sb_user_id';
export const USER_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Returns existing user identity from cookie, or generates a new one.
 */
export async function getOrCreateUserId(): Promise<{ userId: string; isNew: boolean }> {
  const cookieStore = cookies();
  const existing = cookieStore.get(USER_ID_COOKIE_NAME);

  if (existing?.value && existing.value.length > 8) {
    return { userId: existing.value, isNew: false };
  }

  const newId = `usr_${crypto.randomUUID()}`;
  return { userId: newId, isNew: true };
}

/**
 * Achievement definitions and progress calculation.
 * Accrues strictly on genuine (non-demo) submissions.
 */
export const MILESTONES: Omit<AchievementTier, 'unlocked'>[] = [
  {
    id: 'first_report',
    title: 'First Report',
    description: 'Submitted your first civic report or public service inquiry.',
    requiredCount: 1,
    icon: 'Radio',
  },
  {
    id: 'community_contributor',
    title: 'Community Contributor',
    description: 'Documented 5 verified community issues to assist local response.',
    requiredCount: 5,
    icon: 'ShieldCheck',
  },
  {
    id: 'active_contributor',
    title: 'Active Contributor',
    description: 'Submitted 10 comprehensive reports helping keep public spaces safe.',
    requiredCount: 10,
    icon: 'Award',
  },
  {
    id: 'civic_champion',
    title: 'Civic Champion',
    description: 'Submitted 25 reports helping resolve community challenges.',
    requiredCount: 25,
    icon: 'Trophy',
  },
];

export function calculateUserAchievements(validReportCount: number): UserAchievements {
  const achievements: AchievementTier[] = MILESTONES.map((m) => ({
    ...m,
    unlocked: validReportCount >= m.requiredCount,
  }));

  const nextMilestone = achievements.find((a) => !a.unlocked);
  let progressToNext = 100;

  if (nextMilestone) {
    const prevRequired =
      MILESTONES[MILESTONES.findIndex((m) => m.id === nextMilestone.id) - 1]?.requiredCount || 0;
    const progressRange = nextMilestone.requiredCount - prevRequired;
    const currentProgress = validReportCount - prevRequired;
    progressToNext = Math.min(100, Math.max(0, Math.round((currentProgress / progressRange) * 100)));
  }

  return {
    totalSubmissions: validReportCount,
    achievements,
    nextMilestone,
    progressToNext,
  };
}
