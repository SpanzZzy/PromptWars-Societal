import { NextRequest, NextResponse } from 'next/server';
import { validateAdminLogin, createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/admin';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const isValid = validateAdminLogin(username, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid admin credentials or demo account not configured.' },
        { status: 401 }
      );
    }

    const token = createSessionToken(username);
    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful.',
      username,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
