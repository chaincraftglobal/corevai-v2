import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ projects: [] });

    const projects = await prisma.project.findMany({
        where: { ownerId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, createdAt: true },
    });

    return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json().catch(() => ({}));
    const clean = (name || "").toString().trim();
    if (!clean) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const project = await prisma.project.create({
        data: { name: clean, ownerId: session.user.id },
        select: { id: true, name: true },
    });

    return NextResponse.json(project);
}