import { NextResponse } from "next/server";

/**
 * Limited deployment placeholder:
 * - Disables the start-analysis endpoint to avoid type requirements (e.g., userId)
 *   and any external service/database interactions.
 * - Always returns 501 Not Implemented.
 */
export async function POST(_request: Request) {
  return NextResponse.json(
    { error: "Start analysis is not available in this limited version." },
    { status: 501 }
  );
}

// Optional: if your app might call GET on this route, keep it safe too.
export async function GET(_request: Request) {
  return NextResponse.json(
    { error: "Start analysis is not available in this limited version." },
    { status: 501 }
  );
}
