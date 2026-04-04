import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";
import prisma from "@/lib/database";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);

    if (!payload.userId) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const userId = payload.userId as number;

    // Check user exists and hasn't already completed the survey
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, credits: true, surveyCompletedAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.surveyCompletedAt) {
      return NextResponse.json({ error: "Survey already completed." }, { status: 409 });
    }

    const body = await request.json();
    const {
      previousFeedbackMethods,
      feedbackFrequency,
      surprisedBy,
      actionability,
      accuracy,
      role,
      siteType,
      alternativeIfGone,
      paidBefore,
      paidForWhat,
      previousCost,
      earlyAccessInterest,
    } = body;

    // Save survey response and credit user atomically
    const [, updatedUser] = await prisma.$transaction([
      prisma.surveyResponse.create({
        data: {
          userId,
          previousFeedbackMethods: previousFeedbackMethods ?? [],
          feedbackFrequency: feedbackFrequency ?? null,
          surprisedBy: surprisedBy ?? null,
          actionability: actionability ?? null,
          accuracy: accuracy ?? null,
          role: role ?? null,
          siteType: siteType ?? null,
          alternativeIfGone: alternativeIfGone ?? null,
          paidBefore: paidBefore ?? null,
          paidForWhat: paidForWhat ?? null,
          previousCost: previousCost ?? null,
          earlyAccessInterest: earlyAccessInterest ?? null,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: { increment: 1 },
          surveyCompletedAt: new Date(),
        },
        select: { credits: true },
      }),
    ]);

    return NextResponse.json({ creditAwarded: 1, totalCredits: updatedUser.credits });
  } catch (error) {
    console.error("Survey submit error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
