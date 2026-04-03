import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/database';
import type { Screenshot } from '@/types';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Extract the storage path from a full Supabase public URL
function storagePathFromUrl(storageUrl: string): string | null {
  try {
    const url = new URL(storageUrl);
    // Supabase public URLs look like: /storage/v1/object/public/screenshots/job_xxx/file.png
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/screenshots\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

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
    // URLs present in DB but not in the new screenshots list should be removed
    const incomingUrls = new Set(byUrl.keys());

    // Collect storage paths to delete (pages removed entirely + screenshots removed from kept pages)
    const storagePathsToDelete: string[] = [];

    for (const page of run.analyzedPages) {
      if (!incomingUrls.has(page.url)) {
        // Entire page removed — collect all its screenshot storage paths
        for (const s of page.screenshots) {
          const p = storagePathFromUrl(s.storageUrl);
          if (p) storagePathsToDelete.push(p);
        }
      } else {
        // Page kept — collect paths for screenshots that aren't in the incoming list
        const incomingStorageUrls = new Set(
          (byUrl.get(page.url) ?? []).map(
            (s) => s.data?.storageUrl ?? s.data?.path ?? s.data?.filename ?? ''
          )
        );
        for (const s of page.screenshots) {
          if (!incomingStorageUrls.has(s.storageUrl)) {
            const p = storagePathFromUrl(s.storageUrl);
            if (p) storagePathsToDelete.push(p);
          }
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      // Delete pages (and their screenshots) that were removed by the user
      for (const page of run.analyzedPages) {
        if (!incomingUrls.has(page.url)) {
          await tx.screenshot.deleteMany({ where: { analyzedPageId: page.id } });
          await tx.analyzedPage.delete({ where: { id: page.id } });
        }
      }

      for (const [url, pageScreenshots] of byUrl) {
        if (existingUrls.has(url)) {
          // URL already tracked — replace all screenshots to reflect user edits (deletions + additions)
          const page = run.analyzedPages.find((p) => p.url === url)!;
          await tx.screenshot.deleteMany({ where: { analyzedPageId: page.id } });

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

    // Clean up deleted screenshots from storage (best-effort, non-blocking)
    if (storagePathsToDelete.length > 0) {
      supabase.storage
        .from('screenshots')
        .remove(storagePathsToDelete)
        .then(({ error }) => {
          if (error) console.warn('Storage cleanup partial failure:', error.message);
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to sync screenshots:', error);
    return NextResponse.json({ error: 'Failed to sync screenshots' }, { status: 500 });
  }
}
