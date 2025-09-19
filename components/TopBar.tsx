"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { createConversation } from "@/lib/chat";

export default function TopBar() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const newChat = async () => {
        try {
            const { id } = await createConversation();
            router.push(`/chats/${id}`);
        } catch (err) {
            console.error("Failed to create conversation:", err);
        }
    };

    return (
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-neutral-800">
            {/* Left: Logo + New Chat */}
            <button
                onClick={newChat}
                className="flex items-center gap-2"
                title="New chat"
            >
                <Image
                    src="/corevai-logo.png"
                    alt="CoreVAI"
                    width={32}
                    height={32}
                    priority
                />
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                    CoreVAI
                </span>
            </button>

            {/* Right: Auth controls */}
            <div className="flex items-center gap-3">
                {status === "authenticated" && session?.user ? (
                    <>
                        <div className="text-sm text-gray-700 dark:text-gray-200 text-right">
                            <div className="font-medium">
                                {session.user.name ?? "User"}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs">
                                {session.user.email}
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 dark:border-neutral-700"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => router.push("/login")}
                            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 dark:border-neutral-700"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => router.push("/signup")}
                            className="rounded-md border px-3 py-1.5 text-sm bg-black text-white dark:bg-white dark:text-black"
                        >
                            Sign up
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}