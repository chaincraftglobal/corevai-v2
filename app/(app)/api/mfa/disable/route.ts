import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.twoFactor.updateMany({ where: { userId: session.user.id }, data: { enabled: false } });
    await prisma.backupCode.deleteMany({ where: { userId: session.user.id } });

    return NextResponse.json({ ok: true });
}