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
      <div className="px-6 py-2 flex items-center justify-between border-b border-gray-100">
        <div className="flex -space-x-2">
          {members.slice(0, 5).map((member, i) => (
            <img
              key={i}
              src={member.user.image ?? ""}
              alt={member.user.name ?? ""}
              title={member.user.name ?? ""}
              className="w-6 h-6 rounded-full border-2 border-white"
            />
          ))}
          {members.length > 5 && (
            <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
              +{members.length - 5}
            </div>
          )}
        </div>
        {connected ? (
          <span className="text-xs text-green-500">● Connected</span>
        ) : (
          <span className="text-xs text-red-500">● Connecting...</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-12">
            No messages yet. Say something!
          </p>
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
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                    isMe
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs font-medium mb-1 text-gray-500">
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
          <p className="text-xs text-gray-400 italic">
            {typingUser} is typing...
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200">
        <MessageInput onSend={sendMessage} onTyping={handleTyping} />
      </div>
    </>
  );
}