import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import * as speakeasy from "speakeasy";
import bcrypt from "bcryptjs";
import { MFA_OK_COOKIE, MFA_OK_MAX_AGE } from "@/lib/mfa";

export const runtime = "nodejs";

type Body = { token?: string; backupCode?: string };

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token, backupCode } = (await req.json()) as Body;

    // Fetch secret
    const tf = await prisma.twoFactor.findUnique({ where: { userId: session.user.id } });
    if (!tf?.enabled || !tf.secret) {
        return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
    }

    let ok = false;

    if (token) {
        ok = speakeasy.totp.verify({ secret: tf.secret, encoding: "base32", token, window: 1 });
    } else if (backupCode) {
        const codes = await prisma.backupCode.findMany({ where: { userId: session.user.id } });
        for (const c of codes) {
            if (await bcrypt.compare(backupCode, c.codeHash)) {
                ok = true;
                // mark used
                await prisma.backupCode.update({ where: { id: c.id }, data: { usedAt: new Date() } });
                break;
            }
        }
    }

    if (!ok) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

    // Set cookie to allow sensitive actions
    const res = NextResponse.json({ ok: true });
    res.cookies.set(MFA_OK_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: MFA_OK_MAX_AGE,
    });
    return res;
}