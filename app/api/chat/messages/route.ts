// app/api/chat/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Body = { conversationId: string; content: string };

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const body = (await req.json()) as Body;

        if (!body?.conversationId || !body?.content?.trim()) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Only allow posting to your own conversation
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const convo = await prisma.conversation.findFirst({
            where: { id: body.conversationId, ownerId: session.user.id, deletedAt: null },
            select: { id: true },
        });
        if (!convo) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
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

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error("POST /api/chat/messages error:", err);
        return NextResponse.json({ error: "MSG_CREATE_FAILED", detail: err?.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get("conversationId");

        if (!conversationId) {
            return NextResponse.json({ error: "conversationId required" }, { status: 400 });
        }
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const convo = await prisma.conversation.findFirst({
            where: { id: conversationId, ownerId: session.user.id, deletedAt: null },
            select: { id: true },
        });
        if (!convo) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
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