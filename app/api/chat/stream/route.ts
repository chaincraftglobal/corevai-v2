// app/api/chat/stream/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    try {
        const { conversationId, prompt } = (await req.json()) as {
            conversationId?: string;
            prompt?: string;
        };

        if (!conversationId || !prompt?.trim()) {
            return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
        }

        if (!session?.user?.id) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // Verify ownership (no cross-user leaks)
        const convo = await prisma.conversation.findFirst({
            where: { id: conversationId, ownerId: session.user.id, deletedAt: null },
            select: { id: true },
        });
        if (!convo) {
            return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
        }

        // Create placeholder assistant message first
        const placeholder = await prisma.message.create({
            data: { conversationId, role: "assistant", content: "" },
            select: { id: true },
        });

        const encoder = new TextEncoder();
        let full = "";

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                try {
                    // Stream from OpenAI
                    const completion = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [{ role: "user", content: prompt }],
                        stream: true,
                    });

                    for await (const part of completion) {
                        const token = part.choices?.[0]?.delta?.content ?? "";
                        if (token) {
                            full += token;
                            controller.enqueue(encoder.encode(token));
                        }
                    }

                    const finalText = full.trim();

                    // Update placeholder with final content (or delete if empty)
                    if (finalText.length > 0) {
                        await prisma.message.update({
                            where: { id: placeholder.id },
                            data: { content: finalText },
                        });
                    } else {
                        // No useful content came back—delete placeholder
                        await prisma.message.delete({ where: { id: placeholder.id } });
                    }

                    await prisma.conversation.update({
                        where: { id: conversationId },
                        data: { updatedAt: new Date() },
                    });

                    controller.close();
                } catch (e) {
                    console.error("AI stream error:", e);
                    // Best-effort mark the placeholder as errored (don’t block if this fails)
                    try {
                        await prisma.message.update({
                            where: { id: placeholder.id },
                            data: { content: "(error while generating response)" },
                        });
                    } catch (_) { }
                    controller.error(e);
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                // Let the client know which message ID to reconcile with after stream
                "X-Assistant-Id": placeholder.id,
            },
        });
    } catch (e) {
        const detail = e instanceof Error ? e.message : "Unknown error";
        console.error("POST /api/chat/stream error:", detail);
        return new Response(JSON.stringify({ error: "STREAM_FAILED", detail }), { status: 500 });
    }
}