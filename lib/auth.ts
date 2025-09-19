// lib/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

/**
 * If you haven't already, add this module augmentation in types/next-auth.d.ts:
 *
 * declare module "next-auth" {
 *   interface Session {
 *     user: { id: string; name?: string | null; email?: string | null; image?: string | null };
 *   }
 * }
 */

// You can leave this untyped; NextAuth will validate at runtime.
// If you want a type, you could do `as const` or `satisfies Record<string, unknown>`.
export const authOptions = {
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt" as const },

    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID ?? "",
            clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
            allowDangerousEmailAccountLinking: true,
        }),

        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email?.toLowerCase().trim() ?? "";
                const password = credentials?.password ?? "";
                if (!email || !password) return null;

                const user = await prisma.user.findUnique({ where: { email } });
                if (!user?.passwordHash) return null;

                const ok = await bcrypt.compare(password, user.passwordHash);
                if (!ok) return null;

                return {
                    id: user.id,
                    name: user.name ?? undefined,
                    email: user.email ?? undefined,
                    image: user.image ?? undefined,
                };
            },
        }),
    ],

    pages: { signIn: "/login" },

    callbacks: {
        async jwt({
            token,
            user,
        }: {
            token: JWT;
            user?: (User & { id?: string }) | null;
        }) {
            // On first sign-in, persist the user id onto the JWT
            if (user?.id) token.sub = user.id;
            return token;
        },

        async session({
            session,
            token,
        }: {
            session: Session;
            token: JWT;
        }) {
            if (session.user && token.sub) {
                (session.user as { id: string }).id = token.sub;
            }
            return session;
        },
    },
};

// Export v5 helpers + route handlers
export const {
    handlers: { GET, POST }, // for app/api/auth/[...nextauth]/route.ts
    auth,                     // use in server routes: const session = await auth();
    signIn,
    signOut,
} = NextAuth(authOptions);