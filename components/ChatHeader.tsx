"use client";

import { useEffect, useRef, useState } from "react";

export default function ChatHeader({
    initialTitle,
    onRename,
    childrenRight,
}: {
    initialTitle: string;
    onRename: (title: string) => Promise<void> | void;
    childrenRight?: React.ReactNode; // e.g., project picker
}) {
    const [title, setTitle] = useState(initialTitle || "Untitled chat");
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTitle(initialTitle || "Untitled chat");
    }, [initialTitle]);

    useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    const commit = async () => {
        const t = title.trim() || "Untitled chat";
        setBusy(true);
        try {
            await onRename(t);
        } finally {
            setBusy(false);
            setEditing(false);
        }
    };

    return (
        <div className="h-12 border-b border-gray-200 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                {editing ? (
                    <input
                        ref={inputRef}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") commit();
                            if (e.key === "Escape") setEditing(false);
                        }}
                        onBlur={commit}
                        className="border rounded-md px-2 py-1 text-sm"
                        disabled={busy}
                    />
                ) : (
                    <button className="text-sm font-medium" onClick={() => setEditing(true)} title="Rename chat">
                        {title}
                    </button>
                )}
            </div>
            <div className="flex items-center gap-2">{childrenRight}</div>
        </div>
    );
}