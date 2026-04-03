import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", request.url));

  res.cookies.set("token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return res;
}
