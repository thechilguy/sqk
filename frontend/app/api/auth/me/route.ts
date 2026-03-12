import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const backendRes = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
    headers: { Authorization: auth },
    cache: 'no-store',
  });

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}
