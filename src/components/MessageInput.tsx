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
        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      <button
        type="submit"
        disabled={!content.trim()}
        className="px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-700 disabled:opacity-50 transition"
      >
        Send
      </button>
    </form>
  );
}