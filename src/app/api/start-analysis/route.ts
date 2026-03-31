import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";
import prisma from "@/lib/database";

const ANALYSIS_SERVICE_URL = "http://localhost:3002/api/analysis";
const CREDITS_PER_ANALYSIS = 1;

export async function POST(request: Request) {
  // Authenticate
  const token = cookies().get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let userId: number;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    if (!payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    userId = payload.userId as number;
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { analysisData, captureJobId } = body;

    if (!analysisData || !captureJobId) {
      return NextResponse.json(
        { error: "Missing required fields: analysisData and captureJobId" },
        { status: 400 }
      );
    }

    // Deduct credit atomically — fails if insufficient balance
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { credits: true },
        });

        if (!user || user.credits < CREDITS_PER_ANALYSIS) {
          throw new Error("INSUFFICIENT_CREDITS");
        }

        await tx.user.update({
          where: { id: userId },
          data: { credits: { decrement: CREDITS_PER_ANALYSIS } },
        });
      });
    } catch (err) {
      if (err instanceof Error && err.message === "INSUFFICIENT_CREDITS") {
        return NextResponse.json(
          { error: "Insufficient credits. Redeem a voucher code to run more analyses." },
          { status: 402 }
        );
      }
      throw err;
    }

    // Update org name and purpose on the project now that the user has confirmed them
    if (analysisData.websiteUrl) {
      await prisma.project.updateMany({
        where: {
          userId,
          baseUrl: analysisData.websiteUrl,
        },
        data: {
          orgName: analysisData.organizationName || undefined,
          orgPurpose: analysisData.sitePurpose || undefined,
          targetAudience: analysisData.targetAudience || undefined,
          primaryGoal: analysisData.primaryGoal || undefined,
          industry: analysisData.industry || undefined,
        },
      }).catch((err: unknown) => {
        console.warn("Failed to update project org details:", err);
      });
    }

    const response = await fetch(ANALYSIS_SERVICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisData, captureJobId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Refund the credit — analysis never started
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: CREDITS_PER_ANALYSIS } },
      }).catch((err: unknown) => console.error("Failed to refund credit after analysis error:", err));
      return NextResponse.json(
        { error: `Analysis service error: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      analysisJobId: result.jobId,
      status: result.status,
      message: result.message,
    });
  } catch (error) {
    // Refund the credit — something went wrong before analysis could start
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: CREDITS_PER_ANALYSIS } },
    }).catch((err: unknown) => console.error("Failed to refund credit after unexpected error:", err));
    const message = error instanceof Error ? error.message : "Failed to start analysis";
    console.error("start-analysis route error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  try {
    const response = await fetch(`${ANALYSIS_SERVICE_URL}/${jobId}`);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Analysis service error: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get analysis status";
    console.error("start-analysis GET route error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
