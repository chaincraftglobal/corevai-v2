// app/api/chat/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Small helper to safely parse JSON
async function parseJson<T>(req: NextRequest): Promise<T | null> {
    try {
        return (await req.json()) as T;
    } catch {
        return null;
    }
}

type PostBody = {
    projectId?: string | null;
    title?: string | null;
};

// GET: list all conversations for the logged-in user (guests see none)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            // Do NOT leak chats to guests
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
            orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
        });

        return NextResponse.json({ conversations });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        console.error("GET /api/chat/conversations error:", msg);
        return NextResponse.json(
            { error: "CONVO_LIST_FAILED", detail: msg },
            { status: 500 }
        );
    }
}

// POST: create a conversation (ownerId = logged-in user, or null for guest)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        const body = await parseJson<PostBody>(req);
        const projectId =
            typeof body?.projectId === "string" && body.projectId.trim() ? body.projectId : null;
        const titleInput = typeof body?.title === "string" ? body.title : "";
        const cleanTitle = titleInput.trim() || null;

        // If you want to **require** login for creating conversations, uncomment:
        // if (!session?.user?.id) {
        //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        // (Optional) If a projectId was provided, ensure it belongs to the user
        if (projectId && session?.user?.id) {
            const ownsProject = await prisma.project.findFirst({
                where: { id: projectId, ownerId: session.user.id },
                select: { id: true },
            });
            if (!ownsProject) {
                return NextResponse.json(
                    { error: "INVALID_PROJECT", detail: "Project does not exist or is not yours." },
                    { status: 400 }
                );
            }
        }

        const created = await prisma.conversation.create({
            data: {
                ownerId: session?.user?.id ?? null, // null => guest
                projectId,
                title: cleanTitle,
                pinned: false,
            },
            select: { id: true },
        });

        return NextResponse.json({ id: created.id });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        console.error("POST /api/chat/conversations error:", msg);
        return NextResponse.json(
            { error: "CONVO_CREATE_FAILED", detail: msg },
            { status: 500 }
        );
    }
}