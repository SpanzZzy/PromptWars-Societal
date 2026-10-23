import { NextRequest, NextResponse } from 'next/server';
import { reportRepository } from '@/lib/storage/repository';
import { getOrCreateUserId } from '@/lib/auth/userSession';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const deleteSecret = body.deleteSecret;
    const { userId } = await getOrCreateUserId();

    const deleted = reportRepository.delete(params.id, {
      deleteSecret,
      userId,
      isAdmin: false,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: 'Report not found or unauthorized deletion request.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your report and associated data have been permanently removed.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to process deletion request.' },
      { status: 500 }
    );
  }
}
