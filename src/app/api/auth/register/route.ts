import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import prisma from "@/lib/database";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { Name: name ?? null, email, passwordHash },
    });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const token = await new jose.SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    const res = NextResponse.json({ message: "Account created." }, { status: 201 });
    res.cookies.set("token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
