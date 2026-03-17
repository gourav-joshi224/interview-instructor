import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://127.0.0.1:3001';

export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit') ?? '20';
    const response = await fetch(`${BACKEND_URL}/dashboard/interviews?limit=${encodeURIComponent(limit)}`, {
      method: 'GET',
      cache: 'no-store',
    });

    const payload = (await response.json().catch(() => [])) as unknown;
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
