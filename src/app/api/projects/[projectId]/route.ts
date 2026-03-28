import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const id = parseInt(params.projectId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    // Cascade: delete screenshots → analyzed pages → analysis runs → project
    await prisma.$transaction(async (tx) => {
      const runs = await tx.analysisRun.findMany({ where: { projectId: id }, select: { id: true } });
      const runIds = runs.map(r => r.id);

      if (runIds.length > 0) {
        const pages = await tx.analyzedPage.findMany({ where: { runId: { in: runIds } }, select: { id: true } });
        const pageIds = pages.map(p => p.id);
        if (pageIds.length > 0) {
          await tx.screenshot.deleteMany({ where: { analyzedPageId: { in: pageIds } } });
        }
        await tx.analyzedPage.deleteMany({ where: { runId: { in: runIds } } });
        await tx.analysisRun.deleteMany({ where: { projectId: id } });
      }

      await tx.project.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
