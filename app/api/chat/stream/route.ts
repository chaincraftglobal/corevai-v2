// app/api/chat/stream/route.ts
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
    const { conversationId, prompt } = await req.json();

    if (!conversationId || !prompt?.trim()) {
        return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            let full = "";
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini", // or "gpt-4o" etc.
                    messages: [{ role: "user", content: prompt }],
                    stream: true,
                });

                for await (const part of completion) {
                    const token = part.choices[0]?.delta?.content || "";
                    if (token) {
                        full += token;
                        controller.enqueue(encoder.encode(token));
                    }
                }

                // persist the final assistant message
                if (full.trim()) {
                    await prisma.message.create({
                        data: { conversationId, role: "assistant", content: full.trim() },
                    });
                    await prisma.conversation.update({
                        where: { id: conversationId },
                        data: { updatedAt: new Date() },
                    });
                }

                controller.close();
            } catch (e) {
                console.error("AI stream error:", e);
                controller.error(e);
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
        },
    });
}