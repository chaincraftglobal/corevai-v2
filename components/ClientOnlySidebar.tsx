"use client";

import dynamic from "next/dynamic";

// Load the real Sidebar only on the client
const Sidebar = dynamic(() => import("./Sidebar"), { ssr: false });

export default function ClientOnlySidebar() {
    return <Sidebar />;
}