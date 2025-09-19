// components/MessageBubble.tsx
"use client";

import Avatar from "@/components/Avatar";
import { useMounted } from "@/lib/useMounted";

function formatLocalTime(iso: string) {
    try {
        const d = new Date(iso);
        // Client-only formatting (local timezone)
        return new Intl.DateTimeFormat(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            weekday: "short",
            month: "short",
            day: "numeric",
        }).format(d);
    } catch {
        return "";
    }
}

export default function MessageBubble({
    role,
    content,
    createdAt,
    name,
    avatarUrl,
}: {
    role: "user" | "assistant";
    content: string;
    createdAt: string; // ISO
    name: string;
    avatarUrl?: string | null;
}) {
    const isUser = role === "user";
    const mounted = useMounted();
    const timeStr = mounted ? formatLocalTime(createdAt) : ""; // defer until client

    return (
        <div className={`my-3 flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`flex items-start gap-2 max-w-[80%] ${isUser ? "flex-row-reverse" : ""}`}>
                <Avatar name={name} src={avatarUrl || undefined} side={isUser ? "right" : "left"} />
                <div>
                    <div className="text-[11px] text-gray-500 dark:text-neutral-400 mb-1">
                        <span className="font-medium text-gray-700 dark:text-neutral-200">{name}</span>
                        <span className="mx-1">•</span>
                        {/* Important: suppress hydration warning on this client-only content */}
                        <time suppressHydrationWarning>{timeStr || " "}</time>
                    </div>

                    <div
                        className={`rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap shadow-sm ${isUser
                                ? "bg-black text-white dark:bg-white dark:text-black"
                                : "bg-gray-100 text-gray-900 dark:bg-neutral-900 dark:text-neutral-100"
                            }`}
                    >
                        {/* User messages plain; assistant uses markdown (your MarkdownMessage inside) */}
                        {content}
                    </div>
                </div>
            </div>
        </div>
    );
}