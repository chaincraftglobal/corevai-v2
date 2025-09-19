// app/(public)/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createConversation, sendMessage } from "@/lib/chat";

export default function LandingPage() {
    const router = useRouter();
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);

    async function onSend() {
        const content = text.trim();
        if (!content || busy) return;
        setBusy(true);
        try {
            const { id } = await createConversation();
            await sendMessage(id, content);
            router.push(`/chats/${id}`);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="max-w-3xl w-full text-center space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight">CoreVAI</h1>
                <p className="text-lg text-gray-600 dark:text-neutral-400">
                    Your AI teammate. Ask anything.
                </p>
            </div>

            <div className="mt-10 w-full max-w-3xl">
                <div className="relative">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={4}
                        placeholder="Ask anything to try CoreVAI…"
                        className="w-full resize-none rounded-2xl border p-5 pr-16 dark:bg-neutral-950 dark:border-neutral-800"
                    />
                    <button
                        onClick={onSend}
                        disabled={!text.trim() || busy}
                        className={`absolute bottom-4 right-4 h-11 w-11 rounded-full flex items-center justify-center transition ${text.trim() && !busy
                                ? "bg-black text-white"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-500"
                            }`}
                        aria-label="Send"
                        title="Send"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                            <path d="M7.4 17.6a1 1 0 0 1 0-1.4L13.59 10H8a1 1 0 1 1 0-2h8a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0v-5.59l-6.17 6.18a1 1 0 0 1-1.42 0z" />
                        </svg>
                    </button>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-neutral-400 text-right">
                    Guests can try a few prompts.
                </div>
            </div>
        </div>
    );
}