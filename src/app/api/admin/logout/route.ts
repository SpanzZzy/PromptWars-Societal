import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/admin';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Admin logged out successfully.',
  });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
