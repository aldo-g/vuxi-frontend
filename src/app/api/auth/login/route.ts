import { NextResponse } from "next/server";

/**
 * Limited deployment placeholder:
 * - Disables login logic entirely to avoid type errors and DB/bcrypt usage.
 * - Always returns 501 Not Implemented for this endpoint.
 */
export async function POST(_request: Request) {
  return NextResponse.json(
    { error: "Login is not available in this limited version." },
    { status: 501 }
  );
}
