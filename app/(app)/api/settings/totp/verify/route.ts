import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTotp } from "@/lib/totp";
import { generateBackupCodes, hashCodes } from "@/lib/backup";
import { MFA_OK_COOKIE, MFA_WINDOW_SECONDS } from "@/lib/mfa";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await req.json();
    if (!code || typeof code !== "string") return NextResponse.json({ error: "Invalid code" }, { status: 400 });

    const tf = await prisma.twoFactor.findUnique({ where: { userId: session.user.id } });
    if (!tf) return NextResponse.json({ error: "Not initialized" }, { status: 400 });

    const ok = verifyTotp(code, tf.secret);
    if (!ok) return NextResponse.json({ error: "Invalid TOTP" }, { status: 400 });

    // enable and (re)issue backup codes
    const codes = generateBackupCodes(10);
    const hashes = await hashCodes(codes);

    await prisma.$transaction([
        prisma.twoFactor.update({ where: { userId: session.user.id }, data: { enabled: true } }),
        prisma.backupCode.deleteMany({ where: { userId: session.user.id } }),
        prisma.backupCode.createMany({
            data: hashes.map((h) => ({ userId: session.user.id, codeHash: h })),
        }),
    ]);

    const res = NextResponse.json({ ok: true, backupCodes: codes });
    // mark this browser as MFA-OK for 12h (for API enforcement)
    res.cookies.set(MFA_OK_COOKIE, "1", { path: "/", sameSite: "lax", maxAge: MFA_WINDOW_SECONDS });
    return res;
}