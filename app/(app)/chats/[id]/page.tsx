// app/(app)/chats/[id]/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import ChatComposer from "@/components/ChatComposer";
import MessageBubble from "@/components/MessageBubble";
import TypingDots from "@/components/TypingDots";
import ChatHeader from "@/components/ChatHeader";
import ProjectPicker from "@/components/ProjectPicker";
import ThemeToggle from "@/components/ThemeToggle";
import ExportMenu from "@/components/ExportMenu";

import {
  listMessages,
  sendMessage,
  type Message,
  getConversation,
  updateConversation,
  streamAssistant, // must return { assistantId } from /api/chat/stream headers
  createConversation,
} from "@/lib/chat";

// helper: merge DB messages into local list without wiping UI
function mergeById(prev: Message[], server: Message[]) {
  const seen = new Set(prev.map((m) => m.id));
  const merged = [...prev];
  for (const m of server) {
    if (!seen.has(m.id)) merged.push(m);
  }
  merged.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  return merged;
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const [convTitle, setConvTitle] = useState("Untitled chat");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [guestBlocked, setGuestBlocked] = useState(false);
  const [streamText, setStreamText] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const youName = session?.user?.name ?? "You";
  const youAvatar = session?.user?.image ?? null;
  const botName = "CoreVAI";
  const botAvatar = "/corevai-logo.png";

  async function loadAll(opts: { initial?: boolean } = {}) {
    const isInitial = !!opts.initial;
    if (isInitial) setInitialLoading(true);
    try {
      const [{ title, projectId: pid }, { messages }] = await Promise.all([
        getConversation(id),
        listMessages(id),
      ]);
      setConvTitle(title || "Untitled chat");
      setProjectId(pid);
      setMessages(messages);
    } catch (e: any) {
      if (e?.status === 404) {
        try {
          const { id: newId } = await createConversation();
          router.replace(`/chats/${newId}`);
          return;
        } catch (err) {
          console.error("autocreate failed after 404:", err);
        }
      } else {
        console.error("loadAll error:", e);
      }
    } finally {
      if (isInitial) setInitialLoading(false);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" })
      );
    }
  }

  useEffect(() => {
    loadAll({ initial: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSend = async (text: string) => {
    // optimistic user bubble
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      },
    ]);

    setThinking(true);
    setStreamText("");
    abortRef.current = new AbortController();

    let finalBuffer = "";

    try {
      // persist user message
      await sendMessage(id, text);

      // stream assistant
      const { assistantId } = await streamAssistant(
        id,
        text,
        (chunk) => {
          finalBuffer += chunk;
          setStreamText((prev) => prev + chunk);
          requestAnimationFrame(() =>
            scrollRef.current?.scrollTo({ top: 1e9 })
          );
        },
        abortRef.current.signal
      );

      // finalize assistant bubble locally
      const finalText = finalBuffer.trim();
      if (finalText) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId || `asst-${Date.now()}`,
            role: "assistant",
            content: finalText,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      setStreamText("");

      // background reconcile with DB
      setTimeout(async () => {
        try {
          const { messages: serverMsgs } = await listMessages(id);
          if (assistantId) {
            const serverAss = serverMsgs.find((m) => m.id === assistantId);
            if (serverAss) {
              setMessages((prev) => {
                const idx = prev.findIndex((m) => m.id === assistantId);
                if (idx === -1) return mergeById(prev, serverMsgs);
                const copy = prev.slice();
                copy[idx] = serverAss;
                return copy;
              });
            } else {
              setMessages((prev) => mergeById(prev, serverMsgs));
            }
          } else {
            setMessages((prev) => mergeById(prev, serverMsgs));
          }
        } catch (e) {
          console.warn("background reconcile failed:", e);
        }
      }, 500);
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setStreamText("");
      } else if (e?.status === 429) {
        setGuestBlocked(true);
      } else if (e?.status === 401 && e?.data?.need2FA) {
        window.location.href = e.data.redirect || "/2fa";
      } else {
        console.error("onSend error:", e);
      }
    } finally {
      setThinking(false);
      abortRef.current = null;
    }
  };

  const onRename = async (title: string) => {
    setConvTitle(title);
    try {
      await updateConversation(id, { title });
    } catch (e) {
      console.error(e);
    }
  };

  const cancelStream = () => abortRef.current?.abort();

  return (
    <div className="h-full flex flex-col">
      <ChatHeader
        initialTitle={convTitle}
        onRename={onRename}
        childrenRight={
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ProjectPicker
              conversationId={id}
              initialProjectId={projectId}
              onChange={setProjectId}
            />
            <ExportMenu conversationId={id} />
          </div>
        }
      />

      <div
        ref={scrollRef}
        className="flex-1 overflow-auto px-4 py-4"
        aria-live="polite"
      >
        {initialLoading ? (
          <div className="text-sm text-gray-500 dark:text-neutral-400">
            Loading…
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                content={m.content}
                createdAt={m.createdAt}
                name={m.role === "user" ? youName : botName}
                avatarUrl={m.role === "user" ? youAvatar : botAvatar}
              />
            ))}

            {thinking && streamText && (
              <MessageBubble
                role="assistant"
                content={streamText}
                createdAt={new Date().toISOString()}
                name={botName}
                avatarUrl={botAvatar}
              />
            )}

            {thinking && !streamText && (
              <TypingDots name={botName} avatarUrl={botAvatar} />
            )}
          </>
        )}
      </div>

      <div className="border-top border-t border-gray-200 dark:border-neutral-800 p-3 flex flex-col gap-2">
        <ChatComposer
          onSend={onSend}
          disabled={guestBlocked || initialLoading || thinking}
        />
        {thinking && (
          <div className="flex justify-end">
            <button
              onClick={cancelStream}
              className="text-xs border rounded-md px-2 py-1 hover:bg-gray-50 dark:hover:bg-neutral-900 dark:border-neutral-800"
            >
              Cancel
            </button>
          </div>
        )}
        {guestBlocked && (
          <p className="text-xs text-amber-700">
            Guest limit reached. Please sign in to continue.
          </p>
        )}
      </div>
    </div>
  );
}