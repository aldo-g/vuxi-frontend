import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { AdapterUser } from "@auth/core/adapters";
import * as jose from "jose";
import prisma from "@/lib/database";

const baseAdapter = PrismaAdapter(prisma);

const adapter = {
  ...baseAdapter,
  createUser: ({ name, ...data }: AdapterUser) =>
    (baseAdapter.createUser as Function)({ ...data, Name: name ?? null }),
  updateUser: ({ name, ...data }: Partial<AdapterUser> & Pick<AdapterUser, "id">) =>
    (baseAdapter.updateUser as Function)({ ...data, ...(name !== undefined && { Name: name }) }),
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async redirect() {
      // After Google auth, redirect to our custom callback which sets the JWT cookie
      return "/api/auth/google/callback";
    },
  },
  events: {
    async createUser({ user }) {
      // Ensure new Google users get 1 credit (fallback)
      if (user.id) {
        await prisma.user.update({
          where: { id: parseInt(user.id) },
          data: { credits: 1 },
        });
      }
    },
  },
  session: { strategy: "database" },
});

export async function createJwtForUser(userId: number, email: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  return new jose.SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}
