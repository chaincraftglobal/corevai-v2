"use client";

export default function ExportMenu({ conversationId }: { conversationId: string }) {
    return (
        <div className="relative">
            <details className="group">
                <summary className="list-none cursor-pointer text-xs border rounded-md px-2 py-1 hover:bg-gray-50 dark:hover:bg-neutral-900 dark:border-neutral-800">
                    Export
                </summary>
                <div className="absolute right-0 z-10 mt-2 w-40 rounded-md border bg-white dark:bg-neutral-950 dark:border-neutral-800 shadow">
                    <a
                        href={`/api/chat/conversations/${conversationId}/export?fmt=md`}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-900"
                    >
                        Markdown (.md)
                    </a>
                    <a
                        href={`/api/chat/conversations/${conversationId}/export?fmt=json`}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-900"
                    >
                        JSON (.json)
                    </a>
                </div>
            </details>
        </div>
    );
}