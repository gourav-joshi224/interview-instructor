import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://127.0.0.1:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/interview/question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown proxy error';
    return NextResponse.json({ error: 'Failed to generate interview question.', details }, { status: 500 });
  }
}
