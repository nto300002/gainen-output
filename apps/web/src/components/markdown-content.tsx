"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { Components } from "react-markdown";

type Props = {
  children: string;
  className?: string;
};

const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? "");
    if (match) {
      return (
        <SyntaxHighlighter language={match[1]} style={oneDark} PreTag="div">
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

export function MarkdownContent({ children, className }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown components={components}>
        {children.replace(/\\n/g, "\n")}
      </ReactMarkdown>
    </div>
  );
}
