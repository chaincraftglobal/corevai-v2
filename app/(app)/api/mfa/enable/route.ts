import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as speakeasy from "speakeasy";
import bcrypt from "bcryptjs";
import { generateBackupCodes } from "@/lib/mfa";

export const runtime = "nodejs";

type Body = { base32: string; token: string };

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { base32, token } = (await req.json()) as Body;
    if (!base32 || !token) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const ok = speakeasy.totp.verify({
        secret: base32,
        encoding: "base32",
        token,
        window: 1,
    });
    if (!ok) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

    // Upsert TwoFactor
    await prisma.twoFactor.upsert({
        where: { userId: session.user.id },
        update: { secret: base32, enabled: true },
        create: { userId: session.user.id, secret: base32, enabled: true },
    });

    // Create fresh backup codes (invalidate old)
    await prisma.backupCode.deleteMany({ where: { userId: session.user.id } });
    const plaintext = generateBackupCodes(10);
    const hashes = await Promise.all(
        plaintext.map(async (code) => ({
            userId: session.user.id,
            codeHash: await bcrypt.hash(code, 10),
        }))
    );
    await prisma.backupCode.createMany({ data: hashes });

    return NextResponse.json({ ok: true, backupCodes: plaintext });
}