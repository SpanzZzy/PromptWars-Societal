import { NextRequest, NextResponse } from 'next/server';
import { reportRepository } from '@/lib/storage/repository';
import { getAdminSession } from '@/lib/auth/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const adminMode = searchParams.get('admin') === 'true';

    const rawLimit = searchParams.get('limit');
    const rawOffset = searchParams.get('offset');
    const limit = rawLimit ? Math.min(Math.max(parseInt(rawLimit, 10) || 50, 1), 500) : 100;
    const offset = rawOffset ? Math.max(parseInt(rawOffset, 10) || 0, 0) : 0;

    if (adminMode) {
      // Must be authenticated to view all private/pending reports
      const session = await getAdminSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
      }
      const allReports = reportRepository.getAll({
        includePrivate: true,
        category,
        status,
        limit,
        offset,
      });
      return NextResponse.json({ reports: allReports, count: allReports.length, limit, offset });
    }

    // Public reports only
    const publicReports = reportRepository.getPublicReports({ category, status, limit, offset });
    return NextResponse.json({ reports: publicReports, count: publicReports.length, limit, offset });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch reports';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

