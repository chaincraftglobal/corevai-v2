// app/api/chat/sidebar/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const ownerId = session?.user?.id ?? null;

        // Guests: return empty arrays
        if (!ownerId) {
            return NextResponse.json({ pinned: [], recents: [] });
        }

        // Fetch pinned conversations
        const pinned = await prisma.conversation.findMany({
            where: { ownerId, deletedAt: null, pinned: true },
            select: { id: true, title: true, updatedAt: true },
            orderBy: [{ updatedAt: "desc" }],
            take: 50,
        });

        // Fetch recent conversations
        const recents = await prisma.conversation.findMany({
            where: { ownerId, deletedAt: null, pinned: false },
            select: { id: true, title: true, updatedAt: true },
            orderBy: [{ updatedAt: "desc" }],
            take: 50,
        });

        return NextResponse.json({ pinned, recents });
    } catch (e: unknown) {
        const detail = e instanceof Error ? e.message : "Unknown error";
        console.error("GET /api/chat/sidebar error:", detail);
        return NextResponse.json(
            { error: "SIDEBAR_FETCH_FAILED", detail },
            { status: 500 }
        );
    }
}