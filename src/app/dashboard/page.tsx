import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as jose from 'jose';
import { MainLayout } from "@/components/layout";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import prisma from '@/lib/database';

async function getUserProjects() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);

    if (!payload.userId) {
      redirect('/login');
    }

    const projects = await prisma.project.findMany({
      where: { userId: payload.userId as number },
      include: {
        analysisRuns: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, overallScore: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects;
  } catch {
    redirect('/login');
  }
}

export default async function DashboardPage() {
  const projects = await getUserProjects();

  return (
    <MainLayout title="Dashboard">
      <DashboardClient projects={projects} />
    </MainLayout>
  );
}