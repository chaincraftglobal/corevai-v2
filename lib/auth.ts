// lib/auth.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(creds) {
                const email = creds?.email?.toLowerCase().trim();
                const password = creds?.password || "";
                if (!email || !password) return null;

                const user = await prisma.user.findUnique({ where: { email } });
                if (!user?.passwordHash) return null;

                const ok = await bcrypt.compare(password, user.passwordHash);
                if (!ok) return null;

                return { id: user.id, name: user.name ?? null, email: user.email ?? null, image: user.image ?? null };
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async session({ token, session }) {
            if (token && session.user) (session.user as any).id = token.sub;
            return session;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Use this in API routes to read the session safely
export const auth = () => getServerSession(authOptions);