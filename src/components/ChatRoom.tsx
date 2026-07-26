"use client";

import { useSocket } from "@/hooks/useSocket";
import MessageInput from "@/components/MessageInput";
import { useEffect, useRef } from "react";

interface Message {
  id: string;
  content: string;
  senderId: string;
  roomId: string;
  createdAt: Date;
  sender: {
    name: string | null;
    image: string | null;
  };
}

interface Member {
  user: {
    name: string | null;
    image: string | null;
  };
}

interface Props {
  roomId: string;
  userId: string;
  userName: string;
  userImage: string;
  initialMessages: Message[];
  members: Member[];
}

export default function ChatRoom({
  roomId,
  userId,
  userName,
  userImage,
  initialMessages,
  members,
}: Props) {
  const { messages, sendMessage, handleTyping, typingUser, connected } =
    useSocket({ roomId, userId, userName, userImage, initialMessages });

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {/* Status + members row */}
      <div className="flex items-center justify-between border-b border-border-subtle px-6 py-3">
        <div className="flex -space-x-2">
          {members.slice(0, 5).map((member, i) => (
            <img
              key={i}
              src={member.user.image ?? ""}
              alt={member.user.name ?? ""}
              title={member.user.name ?? ""}
              className="presence-glow h-7 w-7 rounded-full"
            />
          ))}
          {members.length > 5 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-background-card text-xs text-foreground-muted">
              +{members.length - 5}
            </div>
          )}
        </div>
        <span
          className={`flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide ${
            connected ? "text-accent-amber" : "text-accent-coral"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected ? "bg-accent-amber" : "bg-accent-coral"
            }`}
          />
          {connected ? "Connected" : "Connecting..."}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-1 text-center">
            <p className="font-[family-name:var(--font-display)] text-lg italic text-foreground">
              It's quiet in here.
            </p>
            <p className="text-sm text-foreground-muted">
              Say something to light the room up.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.senderId === userId;
            return (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}
              >
                <img
                  src={message.sender.image ?? ""}
                  alt={message.sender.name ?? ""}
                  className="h-8 w-8 flex-shrink-0 rounded-full"
                />
                <div
                  className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                    isMe
                      ? "bg-accent-amber text-background"
                      : "border border-border-subtle bg-background-card text-foreground"
                  }`}
                >
                  {!isMe && (
                    <p className="mb-1 text-xs font-medium text-accent-amber">
                      {message.sender.name}
                    </p>
                  )}
                  <p>{message.content}</p>
                </div>
              </div>
            );
          })
        )}
        {typingUser && (
          <p className="text-xs italic text-foreground-muted">
            {typingUser} is typing...
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border-subtle px-6 py-4">
        <MessageInput onSend={sendMessage} onTyping={handleTyping} />
      </div>
    </>
  );
}