// components/MarkdownMessage.tsx
"use client";

import React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import type { CodeProps } from "react-markdown/lib/ast-to-react";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/components/CodeBlock";

export default function MarkdownMessage({ content }: { content: string }) {
    const components: Components = {
        code(props: CodeProps) {
            const { inline, className, children } = props;

            // ReactMarkdown passes code children as string | string[] | ReactNode[]
            const codeString =
                Array.isArray(children) ? children.join("") : String(children ?? "");

            return (
                <CodeBlock inline={Boolean(inline)} className={className}>
                    {codeString}
                </CodeBlock>
            );
        },

        a({ href, children, ...props }) {
            return (
                <a
                    href={href || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-gray-300 hover:decoration-gray-700"
                    {...props}
                >
                    {children}
                </a>
            );
        },

        ul({ children, ...props }) {
            return (
                <ul className="list-disc pl-6 my-3" {...props}>
                    {children}
                </ul>
            );
        },

        ol({ children, ...props }) {
            return (
                <ol className="list-decimal pl-6 my-3" {...props}>
                    {children}
                </ol>
            );
        },

        blockquote({ children, ...props }) {
            return (
                <blockquote
                    className="border-l-4 border-gray-300 pl-3 my-3 text-gray-700"
                    {...props}
                >
                    {children}
                </blockquote>
            );
        },

        hr(props) {
            return <hr className="my-4 border-gray-200" {...props} />;
        },

        table({ children, ...props }) {
            return (
                <div className="overflow-auto my-3">
                    <table className="w-full border-collapse" {...props}>
                        {children}
                    </table>
                </div>
            );
        },

        th({ children, ...props }) {
            return (
                <th
                    className="border-b border-gray-200 px-2 py-1 text-left font-medium"
                    {...props}
                >
                    {children}
                </th>
            );
        },

        td({ children, ...props }) {
            return (
                <td className="border-b border-gray-100 px-2 py-1 align-top" {...props}>
                    {children}
                </td>
            );
        },
    };

    return (
        <div className="prose prose-sm max-w-none prose-p:my-3 prose-pre:my-0 prose-code:before:content-[''] prose-code:after:content-['']">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {content}
            </ReactMarkdown>
        </div>
    );
}