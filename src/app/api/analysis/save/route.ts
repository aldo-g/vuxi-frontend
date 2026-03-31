import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { sendReportReadyEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  const captureJobId = request.nextUrl.searchParams.get('captureJobId');
  if (!captureJobId) {
    return NextResponse.json({ error: 'Missing captureJobId' }, { status: 400 });
  }
  const run = await prisma.analysisRun.findFirst({
    where: { captureJobId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true },
  });
  if (!run) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ analysisRunId: run.id, status: run.status });
}

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

    // Send completion email
    try {
      const run = await prisma.analysisRun.findUnique({
        where: { id: updated.id },
        select: {
          project: {
            select: {
              baseUrl: true,
              user: { select: { email: true } },
            },
          },
        },
      });
      if (run?.project?.user?.email) {
        await sendReportReadyEmail({
          to: run.project.user.email,
          reportId: updated.id,
          websiteUrl: run.project.baseUrl,
          score: updated.overallScore,
        });
      }
    } catch (err) {
      console.error('Failed to send report-ready email:', err);
    }

    return NextResponse.json({ success: true, analysisRunId: updated.id });
  } catch (error) {
    console.error('Failed to save analysis report:', error);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}
