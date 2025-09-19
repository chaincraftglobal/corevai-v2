import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateBackupCodes, hashCodes } from "@/lib/backup";

export async function POST(_: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tf = await prisma.twoFactor.findUnique({ where: { userId: session.user.id } });
    if (!tf?.enabled) return NextResponse.json({ error: "TOTP not enabled" }, { status: 400 });

    const codes = generateBackupCodes(10);
    const hashes = await hashCodes(codes);

    await prisma.$transaction([
        prisma.backupCode.deleteMany({ where: { userId: session.user.id } }),
        prisma.backupCode.createMany({ data: hashes.map((h) => ({ userId: session.user.id, codeHash: h })) }),
    ]);

    return NextResponse.json({ ok: true, backupCodes: codes });
}