"use client";

import { useEffect, useRef, useState } from "react";
import { createProject, listProjects, updateConversation, type Project } from "@/lib/chat";

export default function ProjectPicker({
    conversationId,
    initialProjectId,
    onChange,
}: {
    conversationId: string;
    initialProjectId?: string | null;
    onChange?: (projectId: string | null) => void;
}) {
    const [open, setOpen] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState("");
    const [current, setCurrent] = useState<string | null>(initialProjectId ?? null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (!ref.current || ref.current.contains(e.target as Node)) return;
            setOpen(false);
            setCreating(false);
        };
        window.addEventListener("click", onClick);
        return () => window.removeEventListener("click", onClick);
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const { projects } = await listProjects();
                setProjects(projects);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const pick = async (pid: string | null) => {
        setCurrent(pid);
        setOpen(false);
        await updateConversation(conversationId, { projectId: pid });
        onChange?.(pid);
    };

    const create = async () => {
        const n = name.trim();
        if (!n) return;
        setCreating(true);
        try {
            const p = await createProject(n);
            setProjects((prev) => [p, ...prev]);
            setName("");
            await pick(p.id);
        } finally {
            setCreating(false);
        }
    };

    const label = current ? projects.find((p) => p.id === current)?.name || "Project" : "No project";

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="text-xs border rounded-md px-2 py-1 hover:bg-gray-50"
                title="Move to project"
            >
                {label}
            </button>

            {open && (
                <div className="absolute right-0 z-10 mt-2 w-64 rounded-md border bg-white shadow">
                    <div className="p-2 border-b">
                        <button
                            className="w-full text-left text-sm px-2 py-1 rounded hover:bg-gray-50"
                            onClick={() => pick(null)}
                        >
                            No project
                        </button>
                    </div>

                    <div className="max-h-60 overflow-auto">
                        {loading ? (
                            <div className="px-2 py-2 text-sm text-gray-500">Loading…</div>
                        ) : projects.length ? (
                            projects.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => pick(p.id)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                    title={p.name}
                                >
                                    {p.name}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No projects yet</div>
                        )}
                    </div>

                    <div className="p-2 border-t">
                        <div className="flex gap-2">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="New project name"
                                className="border rounded px-2 py-1 text-sm flex-1"
                            />
                            <button
                                onClick={create}
                                disabled={creating || !name.trim()}
                                className="text-sm rounded-md bg-black text-white px-3 py-1"
                            >
                                {creating ? "…" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}