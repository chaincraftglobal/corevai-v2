"use client";

import dynamic from "next/dynamic";

// Load the real TopBar only on the client
const TopBar = dynamic(() => import("./TopBar"), { ssr: false });

export default function ClientOnlyTopBar() {
    return <TopBar />;
}