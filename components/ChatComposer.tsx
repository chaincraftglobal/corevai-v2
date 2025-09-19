"use client";

import { useState } from "react";

export default function ChatComposer({
    onSend,
    placeholder = "Message CoreVAI…",
    disabled = false,
}: {
    onSend: (text: string) => Promise<void> | void;
    placeholder?: string;
    disabled?: boolean;
}) {
    const [value, setValue] = useState("");

    const canSend = value.trim().length > 0 && !disabled;

    const submit = async () => {
        if (!canSend) return;
        const text = value.trim();
        setValue("");
        await onSend(text);
    };

    return (
        <div className="flex items-center gap-2 rounded-2xl border border-gray-300 px-3 py-2">
            <textarea
                className="flex-1 resize-none outline-none bg-transparent text-sm min-h-[40px] max-h-40"
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submit();
                    }
                }}
            />
            <button
                onClick={submit}
                disabled={!canSend}
                className={`rounded-xl px-3 py-2 text-sm font-medium ${canSend ? "bg-black text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                aria-label="Send"
                title="Send"
            >
                ➤
            </button>
        </div>
    );
}