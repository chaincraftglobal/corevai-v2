import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();
        const cleanEmail = String(email || "").toLowerCase().trim();
        const cleanName = String(name || "").trim();
        const pw = String(password || "");

        if (!cleanName || !cleanEmail || pw.length < 6) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const exists = await prisma.user.findUnique({
            where: { email: cleanEmail },
        });
        if (exists) {
            return NextResponse.json(
                { error: "Email already in use" },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(pw, 10);
        await prisma.user.create({
            data: { name: cleanName, email: cleanEmail, passwordHash },
        });

        return NextResponse.json({ ok: true });
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error("POST /api/auth/signup error:", e.message, e.stack);
        } else {
            console.error("POST /api/auth/signup unknown error:", e);
        }
        return NextResponse.json({ error: "SIGNUP_FAILED" }, { status: 500 });
    }
}