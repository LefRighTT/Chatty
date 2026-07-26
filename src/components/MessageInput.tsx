"use client";

import { useState } from "react";

interface Props {
  onSend: (content: string) => void;
  onTyping: () => void;
}

export default function MessageInput({ onSend, onTyping }: Props) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSend(content);
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          onTyping();
        }}
        placeholder="Type a message..."
        className="flex-1 rounded-full border border-border-subtle bg-background-card px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-amber focus:outline-none"
      />
      <button
        type="submit"
        disabled={!content.trim()}
        className="rounded-full bg-accent-amber px-5 py-2.5 text-sm font-medium text-background transition hover:bg-accent-amber-hover disabled:opacity-40"
      >
        Send
      </button>
    </form>
  );
}