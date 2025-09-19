import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as speakeasy from "speakeasy";
import { issuerForOTP } from "@/lib/mfa";
import QRCode from "qrcode";

export const runtime = "nodejs";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // generate a new temp secret (don’t persist until user verifies)
    const secret = speakeasy.generateSecret({
        name: `${issuerForOTP()} (${user.email || user.id})`,
        length: 20,
    });

    const otpauth = secret.otpauth_url!;
    const qrDataUrl = await QRCode.toDataURL(otpauth);

    return NextResponse.json({
        base32: secret.base32,
        otpauth,
        qrDataUrl,
    });
}