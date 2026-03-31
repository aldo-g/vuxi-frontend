import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { validateAndNormalizeUrl } from '@/lib/validations';

const CAPTURE_SERVICE_URL = 'http://localhost:3001';

async function getAuthenticatedUserId(): Promise<number | null> {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload.userId ? (payload.userId as number) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { baseUrl, options } = body;

    if (!baseUrl) {
      return NextResponse.json({ error: 'baseUrl is required' }, { status: 400 });
    }

    const validation = validateAndNormalizeUrl(baseUrl);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error || 'Invalid URL' }, { status: 400 });
    }

    const response = await fetch(`${CAPTURE_SERVICE_URL}/api/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl: validation.normalizedUrl, options }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start capture';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${CAPTURE_SERVICE_URL}/api/capture/${jobId}`);
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }
    const result = await response.json();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get capture status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
