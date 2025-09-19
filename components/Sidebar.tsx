"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { listSidebar, type SidebarItem, createConversation } from "@/lib/chat";
import { useRouter, usePathname } from "next/navigation";

function usePageVisible(onVisible: () => void) {
    useEffect(() => {
        const handler = () => {
            if (document.visibilityState === "visible") onVisible();
        };
        document.addEventListener("visibilitychange", handler);
        return () => document.removeEventListener("visibilitychange", handler);
    }, [onVisible]);
}

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const [loading, setLoading] = useState(true);
    const [pinned, setPinned] = useState<SidebarItem[]>([]);
    const [recents, setRecents] = useState<SidebarItem[]>([]);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOnce = useCallback(async () => {
        try {
            setError(null);
            const data = await listSidebar();
            setPinned(data.pinned ?? []);
            setRecents(data.recents ?? []);
        } catch (e: any) {
            console.error("Sidebar fetch error:", e);
            setError("Failed to load chats");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOnce(); // one-time fetch on mount
    }, [fetchOnce]);

    // Optional: when user switches back to the tab, refresh once
    usePageVisible(() => {
        // don’t spam—only refresh if we’re already mounted
        fetchOnce();
    });

    const startNew = async () => {
        if (creating) return;
        setCreating(true);
        try {
            const { id } = await createConversation();
            router.push(`/chats/${id}`);
            // no immediate refresh—chat page will update itself
        } catch (e) {
            console.error("Create conversation failed:", e);
        } finally {
            setCreating(false);
        }
    };

    const isActive = (id: string) => pathname?.startsWith(`/chats/${id}`);

    return (
        <div className="h-full flex flex-col">
            <div className="p-3 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
                <div className="font-medium">Chats</div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchOnce}
                        title="Refresh"
                        className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 dark:hover:bg-neutral-900 dark:border-neutral-700"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={startNew}
                        disabled={creating}
                        className="text-xs rounded-md bg-black text-white px-2 py-1 hover:bg-gray-800 disabled:opacity-50"
                    >
                        {creating ? "Creating…" : "New"}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-2 space-y-4">
                {loading ? (
                    <div className="text-xs text-gray-500">Loading…</div>
                ) : error ? (
                    <div className="text-xs text-red-600">{error}</div>
                ) : (
                    <>
                        {pinned.length > 0 && (
                            <section>
                                <div className="px-2 pb-1 text-[10px] uppercase tracking-wide text-gray-500">Pinned</div>
                                <ul className="space-y-1">
                                    {pinned.map((c) => (
                                        <li key={c.id}>
                                            <Link
                                                href={`/chats/${c.id}`}
                                                className={`block rounded-md px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-neutral-900 ${isActive(c.id) ? "bg-gray-100 dark:bg-neutral-900" : ""
                                                    }`}
                                            >
                                                {c.title || "Untitled chat"}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        <section>
                            <div className="px-2 pb-1 text-[10px] uppercase tracking-wide text-gray-500">Recent</div>
                            {recents.length === 0 ? (
                                <div className="text-xs text-gray-500 px-2">No chats yet.</div>
                            ) : (
                                <ul className="space-y-1">
                                    {recents.map((c) => (
                                        <li key={c.id}>
                                            <Link
                                                href={`/chats/${c.id}`}
                                                className={`block rounded-md px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-neutral-900 ${isActive(c.id) ? "bg-gray-100 dark:bg-neutral-900" : ""
                                                    }`}
                                            >
                                                {c.title || "Untitled chat"}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}


