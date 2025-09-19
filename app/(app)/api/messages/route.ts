// app/api/chat/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies as getCookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
    GUEST_COOKIE_NAME,
    GUEST_COOKIE_MAX_AGE,
    GUEST_PROMPT_LIMIT,
} from "@/lib/limits";

export const runtime = "nodejs";

type Body = { conversationId: string; content: string };

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        const body = (await req.json()) as Body;
        if (!body?.conversationId || !body?.content?.trim()) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Guest limit
        let guestNextCount: number | null = null;
        if (!session?.user?.id) {
            const jar = await getCookies();
            const raw = jar.get(GUEST_COOKIE_NAME)?.value ?? "0";
            const used = Number.isNaN(Number(raw)) ? 0 : Number(raw);
            if (used >= GUEST_PROMPT_LIMIT) {
                const res = NextResponse.json(
                    { error: "Guest limit reached", limit: GUEST_PROMPT_LIMIT, remaining: 0, needSignIn: true },
                    { status: 429 }
                );
                res.cookies.set(GUEST_COOKIE_NAME, String(used), {
                    httpOnly: true, sameSite: "lax", path: "/", maxAge: GUEST_COOKIE_MAX_AGE,
                });
                return res;
            }
            guestNextCount = used + 1;
        }

        await prisma.message.create({
            data: {
                conversationId: body.conversationId,
                role: "user",
                content: body.content.trim(),
            },
        });

        await prisma.conversation.update({
            where: { id: body.conversationId },
            data: { updatedAt: new Date() },
            select: { id: true },
        });

        const res = NextResponse.json({ ok: true });
        if (guestNextCount !== null) {
            res.cookies.set(GUEST_COOKIE_NAME, String(guestNextCount), {
                httpOnly: true, sameSite: "lax", path: "/", maxAge: GUEST_COOKIE_MAX_AGE,
            });
        }
        return res;
    } catch (err: any) {
        console.error("POST /api/chat/messages error:", err);
        return NextResponse.json({ error: "MSG_CREATE_FAILED", detail: err?.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get("conversationId");
        if (!conversationId) {
            return NextResponse.json({ error: "conversationId required" }, { status: 400 });
        }

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "asc" },
            select: { id: true, role: true, content: true, createdAt: true },
        });

        return NextResponse.json({ messages });
    } catch (err: any) {
        console.error("GET /api/chat/messages error:", err);
        return NextResponse.json({ error: "LIST_MSG_FAILED", detail: err?.message }, { status: 500 });
    }
}