// components/CodeBlock.tsx
"use client";

import { useMemo, useState } from "react";

// Prism (explicit language)
import { Prism as PrismHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Highlight.js (auto-detect when no language is given)
import { Light as HLJSHighlighter } from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

type CodeBlockProps = {
    inline?: boolean;
    className?: string;
    children?: string | string[];
};

export default function CodeBlock({
    inline = false,
    className = "",
    children,
}: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const code = useMemo(
        () => (Array.isArray(children) ? children.join("") : children) ?? "",
        [children]
    );

    const lang = useMemo(() => {
        const match = /language-(\w+)/.exec(className);
        return match?.[1];
    }, [className]);

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Copy failed", err);
        }
    };

    if (inline) {
        return (
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[0.9em] font-mono dark:bg-neutral-800/60">
                {code}
            </code>
        );
    }

    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <div className="relative group my-3 overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-800">
            <button
                type="button"
                onClick={onCopy}
                className="absolute right-2 top-2 z-10 rounded-md border bg-white/80 px-2 py-1 text-xs text-gray-700 opacity-0 transition group-hover:opacity-100 hover:bg-white dark:bg-neutral-900/80 dark:text-neutral-200 dark:border-neutral-700"
                aria-label="Copy code to clipboard"
                title="Copy"
            >
                {copied ? "Copied" : "Copy"}
            </button>
            {children}
        </div>
    );

    // Prism for explicit language
    if (lang) {
        return (
            <Wrapper>
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
            </Wrapper>
        );
    }

    // HLJS for auto-detect when no language provided
    return (
        <Wrapper>
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
        </Wrapper>
    );
}