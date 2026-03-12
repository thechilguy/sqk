import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('[login] route reached');

  const body = await req.json();

  const backendRes = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    console.log('[login] backend error:', backendRes.status, data);
    return NextResponse.json(
      { message: data.message || 'Login failed' },
      { status: backendRes.status },
    );
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.SECURE_COOKIE === 'true',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24,
  };

  console.log('[login] token received:', !!data.access_token);
  console.log('[login] cookie options:', cookieOptions);

  const res = NextResponse.json({ ok: true });
  res.cookies.set('token', data.access_token, cookieOptions);

  console.log('[login] Set-Cookie header:', res.headers.get('set-cookie'));

  return res;
}
