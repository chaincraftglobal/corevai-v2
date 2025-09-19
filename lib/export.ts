// lib/export.ts
import type { Message } from "@/lib/chat";

export function conversationToMarkdown(title: string | null | undefined, messages: Message[]) {
    const name = title?.trim() || "Untitled chat";
    const lines: string[] = [];
    lines.push(`# ${name}`);
    lines.push("");

    for (const m of messages) {
        const who = m.role === "user" ? "You" : "CoreVAI";
        const ts = new Date(m.createdAt).toLocaleString();
        lines.push(`**${who}** · _${ts}_`);
        lines.push("");
        // Assistant may already contain markdown; user input is plain text—escape triple backticks minimally
        const body = m.content.replace(/```/g, "``\\`");
        if (m.role === "assistant") {
            lines.push(body);
        } else {
            lines.push(body);
        }
        lines.push("");
        lines.push("---");
        lines.push("");
    }

    return lines.join("\n");
}