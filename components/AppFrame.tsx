// components/AppFrame.tsx
"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import type { ReactNode } from "react";

export default function AppFrame({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-dvh">
            <aside className="w-72 border-r border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900">
                <Sidebar />
            </aside>
            <main className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 overflow-auto">{children}</div>
            </main>
        </div>
    );
}