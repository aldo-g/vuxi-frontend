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

export async function PATCH(request: Request) {
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

    const { name, email } = await request.json();

    if (!name && !email) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    // Check email uniqueness if changing email
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== (payload.userId as number)) {
        return NextResponse.json({ error: "Email already in use." }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: payload.userId as number },
      data: {
        ...(name && { Name: name }),
        ...(email && { email }),
      },
      select: { id: true, email: true, Name: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
