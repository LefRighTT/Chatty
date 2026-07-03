import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "./lib/prisma";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      process.env.NEXTJS_URL || "",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Basic health check route
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join a room
  socket.on("join_room", async (roomId: string) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Leave a room
  socket.on("leave_room", (roomId: string) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  // Send a message
  socket.on(
    "send_message",
    async (data: {
      roomId: string;
      senderId: string;
      content: string;
      senderName: string;
      senderImage: string;
    }) => {
      try {
        // Save message to database
        const message = await prisma.message.create({
          data: {
            content: data.content,
            roomId: data.roomId,
            senderId: data.senderId,
          },
          include: {
            sender: {
              select: { name: true, image: true },
            },
          },
        });

        // Broadcast to everyone in the room
        io.to(data.roomId).emit("new_message", {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          roomId: message.roomId,
          createdAt: message.createdAt,
          sender: message.sender,
        });
      } catch (error) {
        console.error("Error saving message:", error);
        socket.emit("error", "Failed to send message");
      }
    }
  );

  // Typing indicators
  socket.on(
    "typing_start",
    (data: { roomId: string; userName: string }) => {
      socket.to(data.roomId).emit("user_typing", data.userName);
    }
  );

  socket.on("typing_stop", (data: { roomId: string }) => {
    socket.to(data.roomId).emit("user_stopped_typing");
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});