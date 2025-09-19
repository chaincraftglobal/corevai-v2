import { getJSON, postJSON, delJSON } from "@/lib/fetcher";

export type Project = { id: string; name: string; createdAt: string };
export type Conversation = {
    id: string;
    title: string | null;
    createdAt: string;
    updatedAt?: string;
    projectId?: string | null;
    pinned?: boolean;
    deletedAt?: string | null;
};

export type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
};

export async function createConversation(projectId?: string | null) {
    return await postJSON<{ id: string }>("/api/chat/conversations", { projectId: projectId ?? null });
}
export async function listConversations() {
    return await getJSON<{ conversations: Conversation[] }>("/api/chat/conversations");
}
export async function listRecents(limit = 10) {
    return await getJSON<{ conversations: Conversation[] }>(`/api/chat/recents?limit=${limit}`);
}
export async function getConversation(id: string) {
    return await getJSON<{ id: string; title: string | null; projectId: string | null; pinned?: boolean }>(
        `/api/chat/conversations/${id}`
    );
}
export async function updateConversation(id: string, patch: { title?: string; projectId?: string | null; pinned?: boolean }) {
    return await postJSON<{ id: string; title: string | null; projectId: string | null; pinned?: boolean }>(
        `/api/chat/conversations/${id}`,
        patch
    );
}
export async function deleteConversation(id: string) {
    return await delJSON<{ ok: true }>(`/api/chat/conversations/${id}`);
}

// Existing:
export async function listMessages(conversationId: string) {
    return await getJSON<{ messages: Message[] }>(`/api/chat/messages?conversationId=${conversationId}`);
}
export async function sendMessage(conversationId: string, content: string) {
    return await postJSON<{ ok: true }>("/api/chat/messages", { conversationId, content });
}

// If you don’t already have projects helpers:
export async function listProjects() {
    return await getJSON<{ projects: Project[] }>("/api/projects");
}
export async function createProject(name: string) {
    return await postJSON<Project>("/api/projects", { name });
}

export type SidebarItem = { id: string; title: string | null; updatedAt: string };
export async function listSidebar() {
    return await getJSON<{ pinned: SidebarItem[]; recents: SidebarItem[] }>("/api/chat/sidebar");
}

// lib/chat.ts (keep your other exports)
export async function streamAssistant(
    conversationId: string,
    prompt: string,
    onChunk: (t: string) => void,
    signal?: AbortSignal
): Promise<{ assistantId: string | null }> {
    const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversationId, prompt }),
        signal,
    });

    if (!res.ok) {
        let data: any = null;
        try { data = await res.json(); } catch { }
        const err: any = new Error(`STREAM_FAILED_${res.status}`);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    const assistantId = res.headers.get("X-Assistant-Id");

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        onChunk(decoder.decode(value));
    }

    return { assistantId };
}

