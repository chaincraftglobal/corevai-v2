// components/CodeBlock.tsx
"use client";

import { useState } from "react";

// Prism (explicit language)
import { Prism as PrismHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Highlight.js (auto-detect when no language is given)
import { Light as HLJSHighlighter } from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

type Props = {
    inline?: boolean;
    className?: string;
    children?: string | string[];
};

export default function CodeBlock({ inline, className, children }: Props) {
    const [copied, setCopied] = useState(false);

    const code = (Array.isArray(children) ? children.join("") : children) ?? "";
    const match = /language-(\w+)/.exec(className || "");
    const lang = match?.[1]; // present if fenced: ```js / ```ts etc.

    if (inline) {
        return (
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[0.9em] font-mono">
                {code}
            </code>
        );
    }

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch (e) {
            console.error("Copy failed", e);
        }
    };

    const sharedContainer = (
        <div className="relative group my-3 overflow-hidden rounded-xl border border-gray-200">
            <button
                onClick={onCopy}
                className="absolute right-2 top-2 z-10 rounded-md border bg-white/80 px-2 py-1 text-xs text-gray-700 opacity-0 transition group-hover:opacity-100 hover:bg-white"
                aria-label="Copy code"
                title="Copy"
            >
                {copied ? "Copied" : "Copy"}
            </button>
            {/* highlighter renders here */}
            <div className="code-host" />
        </div>
    );

    // Render with Prism if language is known; otherwise use HLJS for auto-detect
    if (lang) {
        return (
            <div className="relative group my-3 overflow-hidden rounded-xl border border-gray-200">
                <button
                    onClick={onCopy}
                    className="absolute right-2 top-2 z-10 rounded-md border bg-white/80 px-2 py-1 text-xs text-gray-700 opacity-0 transition group-hover:opacity-100 hover:bg-white"
                    aria-label="Copy code"
                    title="Copy"
                >
                    {copied ? "Copied" : "Copy"}
                </button>
                <PrismHighlighter
                    language={lang}
                    style={oneDark}
                    customStyle={{
                        margin: 0,
                        background: "transparent",
                        padding: 16,
                        fontSize: "0.9rem",
                    }}
                    wrapLongLines
                    PreTag="div"
                >
                    {code}
                </PrismHighlighter>
            </div>
        );
    }

    // No language → autodetect with Highlight.js
    return (
        <div className="relative group my-3 overflow-hidden rounded-xl border border-gray-200">
            <button
                onClick={onCopy}
                className="absolute right-2 top-2 z-10 rounded-md border bg-white/80 px-2 py-1 text-xs text-gray-700 opacity-0 transition group-hover:opacity-100 hover:bg-white"
                aria-label="Copy code"
                title="Copy"
            >
                {copied ? "Copied" : "Copy"}
            </button>
            <HLJSHighlighter
                style={atomOneDark}
                customStyle={{
                    margin: 0,
                    background: "transparent",
                    padding: 16,
                    fontSize: "0.9rem",
                }}
                wrapLongLines
                PreTag="div"
            >
                {code}
            </HLJSHighlighter>
        </div>
    );
}