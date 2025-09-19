// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();
    if (!name || typeof name !== "string") {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    // Use updateMany because ownerId is NOT unique
    const result = await prisma.project.updateMany({
        where: { id: params.id, ownerId: session.user.id },
        data: { name: name.trim() },
    });

    if (result.count === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Now fetch with a unique where
    const updated = await prisma.project.findUnique({
        where: { id: params.id },
        select: { id: true, name: true, createdAt: true },
    });

    return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Use deleteMany for non-unique guard
    const result = await prisma.project.deleteMany({
        where: { id: params.id, ownerId: session.user.id },
    });

    if (result.count === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
}