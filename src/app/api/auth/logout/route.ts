import { NextResponse } from "next/server";

/**
 * Limited deployment placeholder:
 * - No redirect; just clears the auth cookie and returns a JSON message.
 * - Avoids any dependency on NextRequest.
 */
export async function GET(_request: Request) {
  const res = NextResponse.json(
    { message: "Logged out (limited version)." },
    { status: 200 }
  );

  // Clear the authentication cookie safely
  res.cookies.set("token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return res;
}
