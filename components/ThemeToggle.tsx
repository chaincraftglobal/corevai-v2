"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;
    const current = theme === "system" ? resolvedTheme : theme;
    const isDark = current === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 dark:hover:bg-neutral-900"
            title={isDark ? "Switch to light" : "Switch to dark"}
        >
            {isDark ? "🌙 Dark" : "☀️ Light"}
        </button>
    );
}