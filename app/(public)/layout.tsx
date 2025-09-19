// app/(public)/layout.tsx
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
    title: "CoreVAI — Welcome",
    description: "Your AI teammate.",
    icons: { icon: "/corevai-logo.png" },
};

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-dvh flex flex-col bg-white text-gray-900 dark:bg-neutral-950 dark:text-neutral-100">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-neutral-800">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/corevai-logo.png" alt="CoreVAI" width={32} height={32} />
                    <span className="font-semibold">CoreVAI</span>
                </Link>
                <nav className="flex items-center gap-2">
                    <Link
                        href="/login"
                        className="rounded-md px-3 py-1.5 text-sm border hover:bg-gray-50 dark:hover:bg-neutral-900"
                    >
                        Log in
                    </Link>
                    <Link
                        href="/signup"
                        className="rounded-md px-3 py-1.5 text-sm bg-black text-white hover:bg-gray-800"
                    >
                        Sign up
                    </Link>
                </nav>
            </header>

            {/* Main content */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <footer className="h-16 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-neutral-400 border-t border-gray-200 dark:border-neutral-800">
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
                <Link href="/contact">Contact</Link>
            </footer>
        </div>
    );
}