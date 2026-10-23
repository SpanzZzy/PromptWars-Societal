import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin';
import { reportRepository } from '@/lib/storage/repository';

export async function GET() {
  const session = await getAdminSession();
  const stats = reportRepository.getStats();

  return NextResponse.json({
    isAuthenticated: Boolean(session),
    username: session?.username || null,
    stats,
  });
}
