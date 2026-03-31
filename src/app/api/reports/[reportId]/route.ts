import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import prisma from '@/lib/database';

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const id = parseInt(params.reportId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
  }

  try {
    // Verify the report belongs to this user before deleting
    const run = await prisma.analysisRun.findUnique({
      where: { id },
      select: { project: { select: { userId: true } } },
    });

    if (!run || run.project.userId !== userId) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      const pages = await tx.analyzedPage.findMany({ where: { runId: id }, select: { id: true } });
      const pageIds = pages.map(p => p.id);
      if (pageIds.length > 0) {
        await tx.screenshot.deleteMany({ where: { analyzedPageId: { in: pageIds } } });
        await tx.analyzedPage.deleteMany({ where: { runId: id } });
      }
      await tx.analysisRun.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const id = parseInt(params.reportId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
  }

  try {
    const run = await prisma.analysisRun.findUnique({
      where: { id },
      include: {
        project: true,
        analyzedPages: {
          include: {
            screenshots: true,
          },
        },
      },
    });

    if (!run || run.project.userId !== userId) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (!run.finalReport) {
      return NextResponse.json({ error: 'Report not yet available' }, { status: 404 });
    }

    // Build filename -> storageUrl and pageUrl -> storageUrl[] maps for the frontend
    const screenshots: Record<string, string> = {};
    const screenshotsByUrl: Record<string, string[]> = {};
    const normalizeUrl = (u: string) => {
      try {
        const parsed = new URL(u);
        parsed.hostname = parsed.hostname.replace(/^www\./, '');
        if (parsed.pathname === '/') parsed.pathname = '';
        return parsed.href.replace(/\/$/, '');
      } catch {
        return u.replace(/\/$/, '');
      }
    };
    for (const page of run.analyzedPages) {
      const pageUrl = normalizeUrl(page.url);
      for (const shot of page.screenshots) {
        if (shot.filename && shot.storageUrl) {
          screenshots[shot.filename] = shot.storageUrl;
        }
        if (shot.storageUrl) {
          if (!screenshotsByUrl[pageUrl]) screenshotsByUrl[pageUrl] = [];
          screenshotsByUrl[pageUrl].push(shot.storageUrl);
        }
      }
    }

    return NextResponse.json({
      reportData: run.finalReport,
      captureJobId: run.captureJobId,
      screenshots,
      screenshotsByUrl,
      project: {
        id: run.project.id,
        name: run.project.name,
        baseUrl: run.project.baseUrl,
        targetAudience: run.project.targetAudience,
        primaryGoal: run.project.primaryGoal,
        industry: run.project.industry,
      },
    });
  } catch (error) {
    console.error('Failed to fetch report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
