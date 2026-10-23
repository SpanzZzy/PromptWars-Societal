import { NextRequest, NextResponse } from 'next/server';
import { extractAndTranscribe } from '@/lib/gemini/extraction';
import { ExtractionRequestSchema } from '@/lib/schemas/report';
import { isEligibleForBackupKey } from '@/lib/gemini/client';
import { validateMediaUpload, MAX_TOTAL_PAYLOAD_BYTES } from '@/lib/utils/sanitizer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check payload bounds
    const payloadLength = JSON.stringify(body).length;
    if (payloadLength > MAX_TOTAL_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Total request size exceeds 25MB limit.' },
        { status: 413 }
      );
    }

    const validated = ExtractionRequestSchema.parse(body);

    // Validate media uploads
    for (const file of validated.mediaFiles) {
      const approxSizeBytes = Math.round((file.base64Data.length * 3) / 4);
      const validation = validateMediaUpload(file.type, approxSizeBytes);
      if (!validation.valid) {
        return NextResponse.json(
          { error: `${file.name}: ${validation.error}` },
          { status: 400 }
        );
      }
    }

    const result = await extractAndTranscribe(validated);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Extraction error:', err);
    const eligible = isEligibleForBackupKey(err);
    const message = err?.message || 'Failed to extract content or transcribe audio.';

    return NextResponse.json(
      {
        error: message,
        eligibleForBackupKey: eligible,
      },
      { status: eligible ? 403 : 500 }
    );
  }
}
