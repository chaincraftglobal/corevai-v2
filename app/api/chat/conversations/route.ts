// app/api/chat/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET: list all conversations for the logged-in user (guests see none)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            // Do NOT leak other users' chats to guests
            return NextResponse.json({ conversations: [] });
        }

        const conversations = await prisma.conversation.findMany({
            where: { ownerId: session.user.id, deletedAt: null },
            select: {
                id: true,
                title: true,
                projectId: true,
                pinned: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: [
                { pinned: "desc" },
                { updatedAt: "desc" },
                { createdAt: "desc" },
            ],
        });

        return NextResponse.json({ conversations });
    } catch (err: any) {
        console.error("GET /api/chat/conversations error:", err);
        return NextResponse.json({ error: "CONVO_LIST_FAILED", detail: err?.message }, { status: 500 });
    }
}

// POST: create a conversation (ownerId = logged-in user, or null for guest)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const body = await req.json().catch(() => ({} as any));
        const projectId = typeof body?.projectId === "string" ? body.projectId : null;
        const titleInput = typeof body?.title === "string" ? body.title : "";
        const cleanTitle = titleInput.trim() || null;

        // If you want to **require** login for creating conversations, uncomment:
        // if (!session?.user?.id) {
        //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        const created = await prisma.conversation.create({
            data: {
                ownerId: session?.user?.id ?? null, // null => guest
                projectId,
                title: cleanTitle,
                // ensure these columns exist in your schema (you said they do)
                pinned: false,
            },
            select: { id: true },
        });

        return NextResponse.json({ id: created.id });
    } catch (err: any) {
        console.error("POST /api/chat/conversations error:", err);
        return NextResponse.json({ error: "CONVO_CREATE_FAILED", detail: err?.message }, { status: 500 });
    }
}