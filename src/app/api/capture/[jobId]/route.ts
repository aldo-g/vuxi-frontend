import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';

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

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const response = await fetch(`${CAPTURE_SERVICE_URL}/api/capture/${params.jobId}`);
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
