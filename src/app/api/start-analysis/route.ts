import { NextResponse } from "next/server";
import prisma from "@/lib/database";

const ANALYSIS_SERVICE_URL = "http://localhost:3002/api/analysis";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { analysisData, captureJobId } = body;

    if (!analysisData || !captureJobId) {
      return NextResponse.json(
        { error: "Missing required fields: analysisData and captureJobId" },
        { status: 400 }
      );
    }

    // Update org name and purpose on the project now that the user has confirmed them
    if (analysisData.userId && analysisData.websiteUrl) {
      await prisma.project.updateMany({
        where: {
          userId: analysisData.userId,
          baseUrl: analysisData.websiteUrl,
        },
        data: {
          orgName: analysisData.organizationName || undefined,
          orgPurpose: analysisData.sitePurpose || undefined,
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
