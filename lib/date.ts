// lib/date.ts
export function isToday(d: Date) {
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function isYesterday(d: Date) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate();
}

// Group label used in sidebar
export function groupByDay<T extends { createdAt: string }>(item: T) {
    const d = new Date(item.createdAt);
    if (isToday(d)) return "Today" as const;
    if (isYesterday(d)) return "Yesterday" as const;
    return "Earlier" as const;
}

// Consistent message timestamp:
// - Today => "HH:MM"
// - Yesterday => "Yesterday HH:MM"
// - Else => "MMM d, HH:MM"
export function formatMessageTime(iso: string) {
    const d = new Date(iso);
    const hm = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday(d)) return hm;
    if (isYesterday(d)) return `Yesterday ${hm}`;
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${hm}`;
}