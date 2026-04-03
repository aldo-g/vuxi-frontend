import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { PUBLIC_REPORT_IDS } from '@/lib/public-reports';

export async function GET() {
  try {
    const runs = await prisma.analysisRun.findMany({
      where: { status: 'completed', id: { in: PUBLIC_REPORT_IDS } },
      select: {
        id: true,
        overallScore: true,
        createdAt: true,
        captureJobId: true,
        project: {
          select: {
            name: true,
            orgName: true,
            baseUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // For each run, find the first screenshot via captureJobId (may be on a sibling run)
    const captureJobIds = runs.map(r => r.captureJobId).filter(Boolean) as string[];

    // Fetch all run IDs that share the same captureJobIds in one query
    const siblingRuns = await prisma.analysisRun.findMany({
      where: { captureJobId: { in: captureJobIds } },
      select: { id: true, captureJobId: true },
    });

    // Map captureJobId -> first storageUrl
    const siblingRunIds = siblingRuns.map(r => r.id);
    const firstShots = await prisma.analyzedPage.findMany({
      where: { runId: { in: siblingRunIds } },
      orderBy: { id: 'asc' },
      include: {
        screenshots: {
          where: { success: true },
          orderBy: { id: 'asc' },
          take: 1,
          select: { storageUrl: true },
        },
      },
    });

    // Build captureJobId -> storageUrl map
    const jobToScreenshot: Record<string, string> = {};
    for (const page of firstShots) {
      const shot = page.screenshots[0];
      if (!shot) continue;
      const jobId = siblingRuns.find(r => r.id === page.runId)?.captureJobId;
      if (jobId && !jobToScreenshot[jobId]) {
        jobToScreenshot[jobId] = shot.storageUrl!;
      }
    }

    const reports = runs.map((run) => {
      const previewScreenshot = run.captureJobId ? (jobToScreenshot[run.captureJobId] ?? null) : null;

      return {
        id: String(run.id),
        name: run.project.orgName || run.project.name,
        date: run.createdAt.toISOString(),
        description: `Analysis report for ${run.project.name} generated on ${run.createdAt.toLocaleDateString()}.`,
        organization_name: run.project.name,
        generated_at: run.createdAt.toISOString(),
        overall_score: run.overallScore ?? 0,
        status: 'completed',
        website_url: run.project.baseUrl,
        preview_screenshot: previewScreenshot,
      };
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
