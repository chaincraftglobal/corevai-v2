// app/(app)/api/settings/totp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth"; // your helper that wraps getServerSession
import { verifyTotp } from "@/lib/totp";
import { generateBackupCodes, hashCodes } from "@/lib/backup";
import { MFA_OK_COOKIE, MFA_OK_MAX_AGE } from "@/lib/mfa";

export const runtime = "nodejs";

type Body = {
    token?: string;
};

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { token } = (await req.json()) as Body;
    if (!token?.trim()) {
        return NextResponse.json({ error: "TOKEN_REQUIRED" }, { status: 400 });
    }

    // Get current user's TOTP config
    const tf = await prisma.twoFactor.findUnique({
        where: { userId: session.user.id },
    });

    if (!tf?.secret) {
        return NextResponse.json({ error: "TOTP_NOT_SETUP" }, { status: 400 });
    }

    // verifyTotp expects (code, secret)
    const ok = verifyTotp(token.trim(), tf.secret);
    if (!ok) {
        return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
    }

    // Enable 2FA and rotate backup codes
    const plaintextCodes = generateBackupCodes(10);
    const hashed = await hashCodes(plaintextCodes);

    await prisma.$transaction(async (tx) => {
        await tx.twoFactor.update({
            where: { userId: session.user.id },
            data: { enabled: true },
        });

        // Remove old codes and add new ones
        await tx.backupCode.deleteMany({ where: { userId: session.user.id } });
        await tx.backupCode.createMany({
            data: hashed.map((codeHash) => ({
                userId: session.user.id,
                codeHash,
            })),
        });
    });

    const res = NextResponse.json({
        ok: true,
        // For development you might return plaintext codes once.
        // In production, render them in a secure UI instead.
        backupCodes: plaintextCodes,
    });

    // Mark this session as MFA-verified for a period (cookie)
    res.cookies.set(MFA_OK_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: MFA_OK_MAX_AGE, // 12h as per your lib
        secure: true,
    });

    return res;
}