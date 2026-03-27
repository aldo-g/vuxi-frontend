import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { captureJobId, reportData, overallScore } = await request.json();

    if (!captureJobId) {
      return NextResponse.json({ error: 'Missing captureJobId' }, { status: 400 });
    }

    // Find the analysis run by captureJobId
    const analysisRun = await prisma.analysisRun.findFirst({
      where: { captureJobId },
      orderBy: { createdAt: 'desc' },
    });

    if (!analysisRun) {
      return NextResponse.json({ error: 'Analysis run not found for this capture job' }, { status: 404 });
    }

    // Update the run with the final report
    const updated = await prisma.analysisRun.update({
      where: { id: analysisRun.id },
      data: {
        status: 'completed',
        finalReport: reportData ?? {},
        overallScore: overallScore ?? null,
        progress: {
          stage: 'completed',
          percentage: 100,
          message: 'Analysis completed successfully',
        },
      },
    });

    return NextResponse.json({ success: true, analysisRunId: updated.id });
  } catch (error) {
    console.error('Failed to save analysis report:', error);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}
