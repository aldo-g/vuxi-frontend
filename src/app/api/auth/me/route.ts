import { NextResponse } from "next/server";

/**
 * Limited deployment placeholder:
 * - Disables the /me endpoint to avoid JWT/DB logic.
 * - Always returns 501 Not Implemented.
 */
export async function GET(_request: Request) {
  return NextResponse.json(
    { error: "User info is not available in this limited version." },
    { status: 501 }
  );
}
