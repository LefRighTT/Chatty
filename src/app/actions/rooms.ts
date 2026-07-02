"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function createRoom(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const name = formData.get("name") as string;

  if (!name || name.trim() === "") return;

  const room = await prisma.room.create({
    data: {
      name: name.trim(),
      members: {
        create: {
          userId: session.user.id,
        },
      },
    },
  });

  redirect(`/rooms/${room.id}`);
}

export async function getRooms() {
  const rooms = await prisma.room.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { members: true, messages: true },
      },
    },
  });

  return rooms;
}
export async function joinRoom(roomId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  // Check if already a member
  const existing = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: {
        userId: session.user.id,
        roomId,
      },
    },
  });

  if (!existing) {
    await prisma.roomMember.create({
      data: {
        userId: session.user.id,
        roomId,
      },
    });
  }
}