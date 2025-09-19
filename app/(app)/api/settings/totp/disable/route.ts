import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTotp } from "@/lib/totp";
import bcrypt from "bcrypt";
import { MFA_OK_COOKIE } from "@/lib/mfa";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await req.json(); // accept either TOTP or backup code
    if (!code || typeof code !== "string") return NextResponse.json({ error: "Invalid code" }, { status: 400 });

    const tf = await prisma.twoFactor.findUnique({ where: { userId: session.user.id } });
    if (!tf) return NextResponse.json({ error: "Not enabled" }, { status: 400 });

    let allow = verifyTotp(code, tf.secret);
    if (!allow) {
        const hashes = await prisma.backupCode.findMany({ where: { userId: session.user.id }, select: { id: true, codeHash: true } });
        for (const bc of hashes) {
            if (await bcrypt.compare(code, bc.codeHash)) {
                allow = true;
                await prisma.backupCode.update({ where: { id: bc.id }, data: { usedAt: new Date() } });
                break;
            }
        }
    }
    if (!allow) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

    await prisma.$transaction([
        prisma.twoFactor.update({ where: { userId: session.user.id }, data: { enabled: false } }),
        prisma.backupCode.deleteMany({ where: { userId: session.user.id } }),
    ]);

    const res = NextResponse.json({ ok: true });
    res.cookies.delete(MFA_OK_COOKIE);
    return res;
}
