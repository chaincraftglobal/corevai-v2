// app/api/chat/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// ---- helpers ----
async function parseJson<T>(req: NextRequest): Promise<T | null> {
    try {
        return (await req.json()) as T;
    } catch {
        return null;
    }
}

type PostBody = {
    conversationId: string;
    content: string;
};

// ---- POST: append a user message to a conversation you own ----
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await parseJson<PostBody>(req);
        const conversationId =
            typeof body?.conversationId === "string" ? body.conversationId : "";
        const content =
            typeof body?.content === "string" ? body.content.trim() : "";

        if (!conversationId || !content) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Ensure the conversation belongs to this user and isn't deleted
        const convo = await prisma.conversation.findFirst({
            where: { id: conversationId, ownerId: session.user.id, deletedAt: null },
            select: { id: true },
        });
        if (!convo) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.message.create({
            data: { conversationId, role: "user", content },
        });

        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
            select: { id: true },
        });

        return NextResponse.json({ ok: true });
    } catch (e: unknown) {
        const detail = e instanceof Error ? e.message : "Unknown error";
        console.error("POST /api/chat/messages error:", detail);
        return NextResponse.json(
            { error: "MSG_CREATE_FAILED", detail },
            { status: 500 }
        );
    }
}

// ---- GET: list messages for a conversation you own ----
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get("conversationId");

        if (!conversationId) {
            return NextResponse.json(
                { error: "conversationId required" },
                { status: 400 }
            );
        }

        // Ownership check
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
    } catch (e: unknown) {
        const detail = e instanceof Error ? e.message : "Unknown error";
        console.error("GET /api/chat/messages error:", detail);
        return NextResponse.json(
            { error: "LIST_MSG_FAILED", detail },
            { status: 500 }
        );
    }
}