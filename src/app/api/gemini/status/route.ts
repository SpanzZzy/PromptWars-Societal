import { NextResponse } from 'next/server';
import { getGeminiDiagnostics, getGeminiClient, PRIMARY_MODEL_NAME, FALLBACK_MODEL_NAME } from '@/lib/gemini/client';

export async function GET() {
  const diagnostics = getGeminiDiagnostics();
  return NextResponse.json(diagnostics);
}

export async function POST() {
  const clientResolution = getGeminiClient();

  if (!clientResolution.ai) {
    return NextResponse.json({
      success: false,
      configured: false,
      error: 'No GEMINI_API_KEY or GOOGLE_API_KEY detected in environment or .env.local file.',
      source: clientResolution.keyInfo.source,
    });
  }

  try {
    const res = await clientResolution.ai.models.generateContent({
      model: PRIMARY_MODEL_NAME,
      contents: [{ text: 'Respond with the single word "READY" if you receive this.' }],
    });

    const reply = res.text?.trim() || 'READY';
    return NextResponse.json({
      success: true,
      configured: true,
      source: clientResolution.keyInfo.source,
      maskedKey: clientResolution.keyInfo.maskedKey,
      modelUsed: PRIMARY_MODEL_NAME,
      message: `Gemini API live connection verified. Response: "${reply}"`,
    });
  } catch (err: any) {
    // Try fallback model
    try {
      const resFallback = await clientResolution.ai.models.generateContent({
        model: FALLBACK_MODEL_NAME,
        contents: [{ text: 'Respond with the single word "READY" if you receive this.' }],
      });
      return NextResponse.json({
        success: true,
        configured: true,
        source: clientResolution.keyInfo.source,
        maskedKey: clientResolution.keyInfo.maskedKey,
        modelUsed: FALLBACK_MODEL_NAME,
        message: `Gemini API live connection verified via fallback (${FALLBACK_MODEL_NAME}).`,
      });
    } catch (fallbackErr: any) {
      return NextResponse.json({
        success: false,
        configured: true,
        source: clientResolution.keyInfo.source,
        maskedKey: clientResolution.keyInfo.maskedKey,
        error: fallbackErr.message || err.message || 'Gemini API call failed',
      });
    }
  }
}
