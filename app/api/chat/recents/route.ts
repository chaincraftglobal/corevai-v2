// app/api/chat/recents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ conversations: [] });
        }

        const { searchParams } = new URL(req.url);
        const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit") ?? 10)));

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
            orderBy: [{ updatedAt: "desc" }],
            take: limit,
        });

        return NextResponse.json({ conversations });
    } catch (err: any) {
        console.error("GET /api/chat/recents error:", err);
        return NextResponse.json({ error: "RECENTS_FAILED", detail: err?.message }, { status: 500 });
    }
}