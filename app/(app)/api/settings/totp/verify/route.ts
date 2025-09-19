// app/(app)/api/settings/totp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTotp } from "@/lib/totp";
import { generateBackupCodes, hashCodes } from "@/lib/backup";
import { MFA_OK_COOKIE } from "@/lib/mfa";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token) {
        return NextResponse.json({ error: "MISSING_TOKEN" }, { status: 400 });
    }

    const tf = await prisma.twoFactor.findUnique({
        where: { userId: session.user.id },
    });

    if (!tf?.enabled) {
        return NextResponse.json({ error: "2FA_NOT_ENABLED" }, { status: 400 });
    }

    // ✅ Correct usage: pass code + secret separately
    const ok = verifyTotp(token, tf.secret);
    if (!ok) {
        return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
    }

    // generate backup codes if none exist
    const codes = await prisma.backupCode.findMany({
        where: { userId: session.user.id, usedAt: null },
    });

    let newCodes: string[] = [];
    if (codes.length === 0) {
        newCodes = generateBackupCodes();
        const hashed = await hashCodes(newCodes);
        await prisma.backupCode.createMany({
            data: hashed.map((code) => ({
                userId: session.user.id,
                codeHash: code,
            })),
        });
    }

    // set MFA_OK cookie
    const res = NextResponse.json({ ok: true, backupCodes: newCodes });
    res.cookies.set(MFA_OK_COOKIE, "1", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 10, // 10 minutes
    });

    return res;
}