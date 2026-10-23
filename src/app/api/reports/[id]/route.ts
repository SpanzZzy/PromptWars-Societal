import { NextRequest, NextResponse } from 'next/server';
import { reportRepository } from '@/lib/storage/repository';
import { getAdminSession } from '@/lib/auth/admin';
import { getOrCreateUserId } from '@/lib/auth/userSession';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = reportRepository.getById(params.id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const session = await getAdminSession();
    const { userId } = await getOrCreateUserId();
    const isOwner = Boolean(report.userId && report.userId === userId);

    // If report is not public and requester is neither admin nor the owner, deny access
    if (!session && !isOwner && report.publicVisibility !== 'approved') {
      return NextResponse.json({ error: 'Report is private or pending review' }, { status: 403 });
    }

    // Strip internal admin notes for regular public viewers (keep deleteSecret for owner)
    if (!session) {
      const { adminNotes: _, ...safe } = report;
      if (!isOwner) {
        const { deleteSecret: __, ...publicSafe } = safe;
        return NextResponse.json({ report: publicSafe });
      }
      return NextResponse.json({ report: safe });
    }

    return NextResponse.json({ report });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error fetching report' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 401 });
    }

    const body = await req.json();
    const allowedUpdates: any = {};

    if (body.status) allowedUpdates.status = body.status;
    if (body.publicVisibility) allowedUpdates.publicVisibility = body.publicVisibility;
    if (body.adminNotes !== undefined) allowedUpdates.adminNotes = body.adminNotes;
    if (body.urgency) allowedUpdates.urgency = body.urgency;

    const updated = reportRepository.update(params.id, allowedUpdates);
    if (!updated) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, report: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update report' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAdminSession();
    const { userId } = await getOrCreateUserId();
    const { searchParams } = new URL(req.url);
    const deleteSecret = searchParams.get('secret') || undefined;

    const deleted = reportRepository.delete(params.id, {
      isAdmin: Boolean(session),
      deleteSecret,
      userId,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: 'Could not delete report. Unauthorized access or invalid secret.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, message: 'Report successfully deleted.' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Delete operation failed' }, { status: 500 });
  }
}
