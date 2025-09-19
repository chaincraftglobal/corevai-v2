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
        const rawLimit = searchParams.get("limit");
        const parsedLimit = rawLimit ? Number(rawLimit) : 10;
        const limit = Math.max(1, Math.min(50, Number.isNaN(parsedLimit) ? 10 : parsedLimit));

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
    } catch (e: unknown) {
        const detail = e instanceof Error ? e.message : "Unknown error";
        console.error("GET /api/chat/recents error:", detail);
        return NextResponse.json(
            { error: "RECENTS_FAILED", detail },
            { status: 500 }
        );
    }
}