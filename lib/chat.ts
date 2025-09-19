// lib/chat.ts
import { getJSON, postJSON, delJSON } from "@/lib/fetcher";

/* =======================
 * Types
 * ======================= */

export type Project = {
    id: string;
    name: string;
    createdAt: string;
};

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

export type SidebarItem = { id: string; title: string | null; updatedAt: string };

type CreateConversationResp = { id: string };
type ListConversationsResp = { conversations: Conversation[] };
type GetConversationResp = { id: string; title: string | null; projectId: string | null; pinned?: boolean };
type UpdateConversationResp = { id: string; title: string | null; projectId: string | null; pinned?: boolean };
type DeleteConversationResp = { ok: true };

type ListMessagesResp = { messages: Message[] };
type SendMessageResp = { ok: true };

type ListProjectsResp = { projects: Project[] };

type ListSidebarResp = { pinned: SidebarItem[]; recents: SidebarItem[] };

export type StreamResult = { assistantId: string | null };

/* Minimal error type (no `any`) */
type HttpishError = Error & { status?: number; data?: unknown };

/* =======================
 * Conversations
 * ======================= */

export async function createConversation(projectId?: string | null) {
    return postJSON<CreateConversationResp>("/api/chat/conversations", {
        projectId: projectId ?? null,
    });
}

export async function listConversations() {
    return getJSON<ListConversationsResp>("/api/chat/conversations");
}

export async function listRecents(limit = 10) {
    return getJSON<ListConversationsResp>(`/api/chat/recents?limit=${limit}`);
}

export async function getConversation(id: string) {
    return getJSON<GetConversationResp>(`/api/chat/conversations/${id}`);
}

export async function updateConversation(
    id: string,
    patch: { title?: string; projectId?: string | null; pinned?: boolean }
) {
    return postJSON<UpdateConversationResp>(`/api/chat/conversations/${id}`, patch);
}

export async function deleteConversation(id: string) {
    return delJSON<DeleteConversationResp>(`/api/chat/conversations/${id}`);
}

/* =======================
 * Messages
 * ======================= */

export async function listMessages(conversationId: string) {
    return getJSON<ListMessagesResp>(`/api/chat/messages?conversationId=${conversationId}`);
}

export async function sendMessage(conversationId: string, content: string) {
    return postJSON<SendMessageResp>("/api/chat/messages", { conversationId, content });
}

/* =======================
 * Projects
 * ======================= */

export async function listProjects() {
    return getJSON<ListProjectsResp>("/api/projects");
}

export async function createProject(name: string) {
    return postJSON<Project>("/api/projects", { name });
}

/* =======================
 * Sidebar
 * ======================= */

export async function listSidebar() {
    return getJSON<ListSidebarResp>("/api/chat/sidebar");
}

/* =======================
 * Streaming assistant
 * ======================= */

export async function streamAssistant(
    conversationId: string,
    prompt: string,
    onChunk: (t: string) => void,
    signal?: AbortSignal
): Promise<StreamResult> {
    const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversationId, prompt }),
        signal,
    });

    if (!res.ok) {
        let data: unknown = null;
        try {
            data = await res.json();
        } catch {
            /* ignore json parse errors */
        }
        const err: HttpishError = Object.assign(new Error(`STREAM_FAILED_${res.status}`), {
            status: res.status,
            data,
        });
        throw err;
    }

    const assistantId = res.headers.get("X-Assistant-Id");
    const reader = res.body?.getReader();
    if (!reader) return { assistantId };

    const decoder = new TextDecoder();

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        onChunk(decoder.decode(value));
    }

    return { assistantId };
}