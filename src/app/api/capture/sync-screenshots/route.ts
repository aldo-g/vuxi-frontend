import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';
import type { Screenshot } from '@/types';

interface SyncBody {
  captureJobId: string;
  screenshots: Screenshot[];
}

export async function POST(request: NextRequest) {
  try {
    const { captureJobId, screenshots }: SyncBody = await request.json();

    if (!captureJobId || !Array.isArray(screenshots)) {
      return NextResponse.json({ error: 'captureJobId and screenshots are required' }, { status: 400 });
    }

    // Find the most recent analysis run for this capture job
    const run = await prisma.analysisRun.findFirst({
      where: { captureJobId },
      orderBy: { createdAt: 'desc' },
      include: { analyzedPages: { include: { screenshots: true } } },
    });

    if (!run) {
      return NextResponse.json({ error: 'Analysis run not found' }, { status: 404 });
    }

    // Group incoming screenshots by URL
    const byUrl = new Map<string, Screenshot[]>();
    for (const s of screenshots) {
      if (!s.success || !s.url) continue;
      const group = byUrl.get(s.url) ?? [];
      group.push(s);
      byUrl.set(s.url, group);
    }

    // Build set of URLs that already exist in the DB for this run
    const existingUrls = new Set(run.analyzedPages.map((p) => p.url));

    await prisma.$transaction(async (tx) => {
      for (const [url, pageScreenshots] of byUrl) {
        if (existingUrls.has(url)) {
          // URL already tracked — add only screenshots that aren't already there
          const page = run.analyzedPages.find((p) => p.url === url)!;
          const existingFilenames = new Set(page.screenshots.map((s) => s.filename ?? s.storageUrl));

          for (const s of pageScreenshots) {
            const filename = s.data?.filename ?? null;
            const storageUrl = s.data?.storageUrl ?? s.data?.path ?? s.data?.filename ?? '';
            // Skip if already recorded (match by filename or storageUrl)
            if (
              (filename && existingFilenames.has(filename)) ||
              existingFilenames.has(storageUrl)
            ) {
              continue;
            }
            await tx.screenshot.create({
              data: {
                analyzedPageId: page.id,
                url,
                filename,
                storageUrl,
                success: true,
                viewport: 'desktop',
                timestamp: s.data?.timestamp ? new Date(s.data.timestamp) : null,
                error: null,
                duration_ms: null,
              },
            });
          }
        } else {
          // New URL — create AnalyzedPage + all its screenshots
          const page = await tx.analyzedPage.create({
            data: { runId: run.id, url, pageAim: `Analysis of ${url}` },
          });

          for (const s of pageScreenshots) {
            await tx.screenshot.create({
              data: {
                analyzedPageId: page.id,
                url,
                filename: s.data?.filename ?? null,
                storageUrl: s.data?.storageUrl ?? s.data?.path ?? s.data?.filename ?? '',
                success: true,
                viewport: 'desktop',
                timestamp: s.data?.timestamp ? new Date(s.data.timestamp) : null,
                error: null,
                duration_ms: null,
              },
            });
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to sync screenshots:', error);
    return NextResponse.json({ error: 'Failed to sync screenshots' }, { status: 500 });
  }
}
