import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const id = parseInt(params.reportId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
  }

  try {
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
  const id = parseInt(params.reportId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
  }

  try {
    const run = await prisma.analysisRun.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!run) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (!run.finalReport) {
      return NextResponse.json({ error: 'Report not yet available' }, { status: 404 });
    }

    return NextResponse.json({
      reportData: run.finalReport,
      captureJobId: run.captureJobId,
      project: {
        id: run.project.id,
        name: run.project.name,
        baseUrl: run.project.baseUrl,
      },
    });
  } catch (error) {
    console.error('Failed to fetch report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
