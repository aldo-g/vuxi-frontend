import { NextResponse } from 'next/server';
import { validateAndNormalizeUrl } from '@/lib/validations';

const CAPTURE_SERVICE_URL = process.env.PIPELINE_URL || 'http://localhost:3001';

export async function POST(request: Request) {
  try {
    const { url, jobId } = await request.json();

    if (!url || !jobId) {
      return NextResponse.json({ error: 'url and jobId are required' }, { status: 400 });
    }

    const validation = validateAndNormalizeUrl(url);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error || 'Invalid URL' }, { status: 400 });
    }

    const response = await fetch(`${CAPTURE_SERVICE_URL}/api/capture/single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, jobId }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to refresh page';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
