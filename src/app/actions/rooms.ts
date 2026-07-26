"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import crypto from "crypto";

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex");
}

export async function createRoom(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const isPrivate = formData.get("isPrivate") === "on";

  if (!name || name.trim() === "") return;

  const room = await prisma.room.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      isPrivate,
      inviteCode: generateInviteCode(),
      members: {
        create: {
          userId: session.user.id,
        },
      },
    },
  });

  redirect(`/rooms/${room.id}`);
}

export async function getRooms(search?: string) {
  const session = await auth();
  const userId = session?.user?.id;

  const rooms = await prisma.room.findMany({
    where: {
      AND: [
        search
          ? { name: { contains: search, mode: "insensitive" as const } }
          : {},
        {
          OR: [
            { isPrivate: false },
            ...(userId ? [{ members: { some: { userId } } }] : []),
          ],
        },
      ],
    },
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

export type JoinByCodeState = { error?: string } | undefined;

export async function joinRoomByCode(
  prevState: JoinByCodeState,
  formData: FormData
): Promise<JoinByCodeState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const code = (formData.get("code") as string)?.trim();
  if (!code) {
    return { error: "Enter an invite code" };
  }

  const room = await prisma.room.findUnique({ where: { inviteCode: code } });
  if (!room) {
    return { error: "Invalid invite code" };
  }

  const existing = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: {
        userId: session.user.id,
        roomId: room.id,
      },
    },
  });

  if (!existing) {
    await prisma.roomMember.create({
      data: {
        userId: session.user.id,
        roomId: room.id,
      },
    });
  }

  redirect(`/rooms/${room.id}`);
}

export async function inviteUserByEmail(roomId: string, email: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const invitedUser = await prisma.user.findUnique({ where: { email } });
  if (!invitedUser) {
    return { error: "No user found with that email" };
  }

  const existing = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: {
        userId: invitedUser.id,
        roomId,
      },
    },
  });

  if (existing) {
    return { error: "That user is already in the room" };
  }

  await prisma.roomMember.create({
    data: {
      userId: invitedUser.id,
      roomId,
    },
  });

  return { success: true };
}