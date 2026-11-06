"use client";

import ReactMarkdown from "react-markdown";

export function DocMarkdown({ content }: { content: string }) {
  if (!content?.trim()) return <p className="text-muted-foreground">No content.</p>;
  return <ReactMarkdown>{content}</ReactMarkdown>;
}
