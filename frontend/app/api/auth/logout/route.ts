import { NextResponse } from 'next/server';

export async function GET() {
  const res = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'),
  );
  res.cookies.delete('token');
  return res;
}
