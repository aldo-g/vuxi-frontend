import { NextResponse } from "next/server";
import { auth, createJwtForUser } from "@/lib/auth";
import prisma from "@/lib/database";

// After NextAuth completes Google OAuth, this route issues our custom JWT cookie
// so the existing middleware and auth system continues to work unchanged.
export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL!));
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL!));
  }

  const token = await createJwtForUser(user.id, user.email);

  const res = NextResponse.redirect(new URL("/dashboard", process.env.NEXTAUTH_URL!));
  res.cookies.set("token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
