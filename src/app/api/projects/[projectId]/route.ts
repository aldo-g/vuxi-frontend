import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/database';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteStorageFolder(folder: string) {
  const { data: files, error: listError } = await supabase.storage
    .from('screenshots')
    .list(folder);

  if (listError || !files || files.length === 0) return;

  const paths = files.map(f => `${folder}/${f.name}`);
  await supabase.storage.from('screenshots').remove(paths);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const id = parseInt(params.projectId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    // Collect captureJobIds before deleting DB records
    const runs = await prisma.analysisRun.findMany({
      where: { projectId: id },
      select: { id: true, captureJobId: true },
    });
    const runIds = runs.map(r => r.id);
    const captureJobIds = runs.map(r => r.captureJobId).filter((id): id is string => !!id);

    // Cascade: delete screenshots → analyzed pages → analysis runs → project
    await prisma.$transaction(async (tx) => {
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

    // Delete screenshot files from storage after DB records are gone
    await Promise.all(captureJobIds.map(jobId => deleteStorageFolder(`job_${jobId}`)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
