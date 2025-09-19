// app/(app)/chats/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createConversation, listRecents } from "@/lib/chat";

export default function ChatsIndexPage() {
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const { conversations } = await listRecents(1);
                if (cancelled) return;

                if (conversations && conversations.length > 0) {
                    // Go to latest chat
                    router.replace(`/chats/${conversations[0].id}?focus=1`);
                    return;
                }

                // No chats yet → create one and go
                const { id } = await createConversation();
                if (!cancelled) {
                    router.replace(`/chats/${id}?focus=1`);
                }
            } catch (e) {
                console.error("Failed to open chat:", e);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [router]);

    return (
        <div className="p-6 text-sm text-gray-500 dark:text-neutral-400">
            Opening chat…
        </div>
    );
}