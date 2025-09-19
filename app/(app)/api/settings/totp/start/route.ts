import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeSecret, makeOtpAuthURL, makeQrDataUrl } from "@/lib/totp";

export async function POST() {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Upsert secret (do not enable yet)
    const secret = makeSecret();
    const existing = await prisma.twoFactor.findUnique({ where: { userId: session.user.id } });
    const tf = existing
        ? await prisma.twoFactor.update({ where: { userId: session.user.id }, data: { secret } })
        : await prisma.twoFactor.create({ data: { userId: session.user.id, secret } });

    const otpauth = makeOtpAuthURL({ secret: tf.secret, email: session.user.email });
    const qr = await makeQrDataUrl(otpauth);

    return NextResponse.json({ otpauth, qr }); // show QR + also allow "enter key manually"
}