import { NextResponse } from "next/server";

/**
 * Limited deployment placeholder:
 * - Disables registration to avoid DB/JWT logic and related type errors.
 * - Always returns 501 Not Implemented for this endpoint.
 */
export async function POST(_request: Request) {
  return NextResponse.json(
    { error: "Registration is not available in this limited version." },
    { status: 501 }
  );
}
