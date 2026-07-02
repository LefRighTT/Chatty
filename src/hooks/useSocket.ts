"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

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

interface UseSocketProps {
  roomId: string;
  userId: string;
  userName: string;
  userImage: string;
  initialMessages: Message[];
}

export function useSocket({
  roomId,
  userId,
  userName,
  userImage,
  initialMessages,
}: UseSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_room", roomId);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("new_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("user_typing", (name: string) => {
      setTypingUser(name);
    });

    socket.on("user_stopped_typing", () => {
      setTypingUser(null);
    });

    return () => {
      socket.emit("leave_room", roomId);
      socket.disconnect();
    };
  }, [roomId]);

  const sendMessage = (content: string) => {
    if (!socketRef.current || !content.trim()) return;

    socketRef.current.emit("send_message", {
      roomId,
      senderId: userId,
      content: content.trim(),
      senderName: userName,
      senderImage: userImage,
    });
  };

  const handleTyping = () => {
    if (!socketRef.current) return;

    socketRef.current.emit("typing_start", { roomId, userName });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing_stop", { roomId });
    }, 1500);
  };

  return { messages, sendMessage, handleTyping, typingUser, connected };
}