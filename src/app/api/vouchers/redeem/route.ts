import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import prisma from '@/lib/database';

export async function POST(request: NextRequest) {
  // Authenticate
  const token = cookies().get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let userId: number;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    if (!payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    userId = payload.userId as number;
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // Parse body
  let code: string;
  try {
    const body = await request.json();
    code = (body.code ?? '').toString().trim().toUpperCase();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'Voucher code is required' }, { status: 400 });
  }

  // Redeem atomically
  try {
    const result = await prisma.$transaction(async (tx) => {
      const voucher = await tx.voucherCode.findUnique({ where: { code } });

      if (!voucher) {
        throw new VoucherError('Invalid voucher code', 404);
      }
      if (voucher.usedById !== null) {
        throw new VoucherError('This voucher has already been redeemed', 409);
      }
      if (voucher.expiresAt && voucher.expiresAt < new Date()) {
        throw new VoucherError('This voucher has expired', 410);
      }

      // Mark voucher as used and add credits in one transaction
      await tx.voucherCode.update({
        where: { code },
        data: { usedById: userId, usedAt: new Date() },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: voucher.credits } },
        select: { credits: true },
      });

      return { creditsAdded: voucher.credits, totalCredits: updatedUser.credits };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof VoucherError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Voucher redemption error:', error);
    return NextResponse.json({ error: 'Failed to redeem voucher' }, { status: 500 });
  }
}

class VoucherError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}
