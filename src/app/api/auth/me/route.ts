import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";
import prisma from "@/lib/database";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);

    if (!payload.userId) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as number },
      select: { id: true, email: true, Name: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }
}
