import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import prisma from '@/lib/database';

export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    if (!payload.userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const projectId = parseInt(params.projectId, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ message: 'Invalid project ID' }, { status: 400 });
    }

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: payload.userId as number },
      select: {
        id: true,
        baseUrl: true,
        orgName: true,
        orgPurpose: true,
        targetAudience: true,
        primaryGoal: true,
        industry: true,
      },
    });

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    // Get the most recent completed run with screenshots
    const latestRun = await prisma.analysisRun.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        analyzedPages: {
          include: {
            screenshots: true,
          },
        },
      },
    });

    if (!latestRun || latestRun.analyzedPages.length === 0) {
      return NextResponse.json({ project, screenshots: [], captureJobId: null });
    }

    // Convert DB screenshots back to the Screenshot[] format the wizard expects
    const screenshots = latestRun.analyzedPages.flatMap((page) =>
      page.screenshots.map((s) => ({
        url: s.url,
        success: s.success,
        data: {
          url: s.url,
          filename: s.filename ?? undefined,
          storageUrl: s.storageUrl || undefined,
          timestamp: s.timestamp?.toISOString() ?? undefined,
          duration_ms: s.duration_ms ?? undefined,
          viewport: s.viewport ?? undefined,
        },
      }))
    );

    return NextResponse.json({
      project,
      screenshots,
      captureJobId: latestRun.captureJobId,
    });
  } catch (error) {
    console.error('Error fetching project screenshots:', error);
    return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
  }
}
