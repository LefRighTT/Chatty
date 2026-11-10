"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { generateInviteCode } from "@/lib/invite";
import { isSiteOwner } from "@/lib/permissions";

const MAX_QUESTIONS = 10;
const MAX_LABEL = 100;
const MAX_ANSWER = 500;

export type ActionResult = {
  error?: string;
  success?: boolean;
  inviteCode?: string;
  questions?: { id: string; label: string; required: boolean }[];
};

// ---------------------------------------------------------------------------
// Helpers (not exported: a "use server" file may only export async functions)
// ---------------------------------------------------------------------------

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  return { id: session.user.id, email: session.user.email ?? null };
}

// Returns the room only if the current user is its creator or the site owner.
async function getManageableRoom(roomId: string) {
  const user = await requireUser();
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, name: true, creatorId: true, inviteCode: true },
  });
  if (!room) return null;
  const canManage = room.creatorId === user.id || isSiteOwner(user.email);
  return canManage ? { user, room } : null;
}

function refresh(roomId?: string) {
  revalidatePath("/rooms");
  if (roomId) revalidatePath(`/rooms/${roomId}`);
}

// ---------------------------------------------------------------------------
// Create / list
// ---------------------------------------------------------------------------

export async function createRoom(formData: FormData) {
  const user = await requireUser();

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
      creatorId: user.id,
      members: {
        create: {
          userId: user.id,
        },
      },
    },
  });

  redirect(`/rooms/${room.id}`);
}

// Visibility rules:
//  - the site owner sees every room
//  - everyone else sees public rooms, plus private rooms they are a member of
export async function getRooms(search?: string) {
  const session = await auth();
  const userId = session?.user?.id;
  const owner = isSiteOwner(session?.user?.email);

  const rooms = await prisma.room.findMany({
    where: {
      AND: [
        search
          ? { name: { contains: search, mode: "insensitive" as const } }
          : {},
        owner
          ? {}
          : {
              OR: [
                { isPrivate: false },
                ...(userId
                  ? [{ members: { some: { userId, status: "ACTIVE" as const } } }]
                  : []),
              ],
            },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          members: { where: { status: "ACTIVE" } },
          messages: true,
        },
      },
    },
  });

  return rooms;
}

// ---------------------------------------------------------------------------
// Joining
// ---------------------------------------------------------------------------

export type JoinByCodeState = { error?: string } | undefined;

// Typing an invite code does NOT join you. It takes you to the room preview,
// where you read the description and fill in the join form (if any).
export async function joinRoomByCode(
  prevState: JoinByCodeState,
  formData: FormData
): Promise<JoinByCodeState> {
  const user = await requireUser();

  const code = (formData.get("code") as string)?.trim();
  if (!code) {
    return { error: "Enter an invite code" };
  }

  // Older rooms have lowercase hex codes; new ones are uppercase.
  const room = await prisma.room.findFirst({
    where: { inviteCode: { in: [code, code.toUpperCase()] } },
  });
  if (!room) {
    return { error: "Invalid invite code" };
  }

  const existing = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId: user.id, roomId: room.id } },
  });
  if (existing) redirect(`/rooms/${room.id}`);

  redirect(`/rooms/${room.id}?code=${encodeURIComponent(room.inviteCode!)}`);
}

export type JoinState = { error?: string } | undefined;

// The only way to become a member. Validates the invite code (private rooms)
// and the creator's join form (required fields) on the server.
export async function requestJoin(
  prevState: JoinState,
  formData: FormData
): Promise<JoinState> {
  const user = await requireUser();

  const roomId = String(formData.get("roomId") ?? "");
  const code = String(formData.get("code") ?? "").trim();

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { questions: { orderBy: { position: "asc" } } },
  });
  if (!room) return { error: "Room not found" };

  if (room.isPrivate && !isSiteOwner(user.email)) {
    const codeOk =
      !!code &&
      !!room.inviteCode &&
      code.toUpperCase() === room.inviteCode.toUpperCase();
    if (!codeOk) {
      return { error: "This room is private. You need a valid invite code." };
    }
  }

  const existing = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId: user.id, roomId } },
  });
  if (existing) redirect(`/rooms/${roomId}`);

  const answers: { questionId: string; value: string }[] = [];
  for (const q of room.questions) {
    const value = String(formData.get(`q_${q.id}`) ?? "")
      .trim()
      .slice(0, MAX_ANSWER);
    if (q.required && !value) {
      return { error: `"${q.label}" is required.` };
    }
    if (value) answers.push({ questionId: q.id, value });
  }

  // "Needs approval" rooms: the applicant waits as PENDING until the creator
  // approves. The creator and site owner never have to wait.
  const needsApproval =
    room.requireApproval &&
    room.creatorId !== user.id &&
    !isSiteOwner(user.email);

  try {
    await prisma.roomMember.create({
      data: {
        userId: user.id,
        roomId,
        status: needsApproval ? "PENDING" : "ACTIVE",
        answers: { create: answers },
      },
    });
  } catch (e) {
    // P2002 = unique constraint: a double click already joined us. Fine.
    if ((e as { code?: string }).code !== "P2002") throw e;
  }

  refresh(roomId);
  redirect(`/rooms/${roomId}`);
}

// Direct invite by email. The inviter must already be in the room (or be the
// site owner). Skips the join form: the creator is inviting them personally.
export async function inviteUserByEmail(
  roomId: string,
  email: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const inviter = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId: session.user.id, roomId } },
  });
  if (inviter?.status !== "ACTIVE" && !isSiteOwner(session.user.email)) {
    return { error: "You must be in this room to invite people" };
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

  if (existing?.status === "ACTIVE") {
    return { error: "That user is already in the room" };
  }

  if (existing) {
    // They had a pending request; an invite approves it.
    await prisma.roomMember.update({
      where: { id: existing.id },
      data: { status: "ACTIVE" },
    });
  } else {
    await prisma.roomMember.create({
      data: {
        userId: invitedUser.id,
        roomId,
      },
    });
  }

  refresh(roomId);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Creator / owner controls
// ---------------------------------------------------------------------------

export async function setRoomPrivacy(
  roomId: string,
  isPrivate: boolean
): Promise<ActionResult> {
  const guard = await getManageableRoom(roomId);
  if (!guard) return { error: "Only the room creator can do that." };

  await prisma.room.update({
    where: { id: roomId },
    data: {
      isPrivate,
      // Rooms created before invite codes existed may have none.
      ...(guard.room.inviteCode ? {} : { inviteCode: generateInviteCode() }),
    },
  });

  refresh(roomId);
  return { success: true };
}

export async function regenerateInviteCode(
  roomId: string
): Promise<ActionResult> {
  const guard = await getManageableRoom(roomId);
  if (!guard) return { error: "Only the room creator can do that." };

  const inviteCode = generateInviteCode();
  await prisma.room.update({ where: { id: roomId }, data: { inviteCode } });

  refresh(roomId);
  return { success: true, inviteCode };
}

export async function setJoinMode(
  roomId: string,
  requireApproval: boolean
): Promise<ActionResult> {
  const guard = await getManageableRoom(roomId);
  if (!guard) return { error: "Only the room creator can do that." };

  await prisma.room.update({ where: { id: roomId }, data: { requireApproval } });

  refresh(roomId);
  return { success: true };
}

export async function approveMember(
  roomId: string,
  memberId: string
): Promise<ActionResult> {
  const guard = await getManageableRoom(roomId);
  if (!guard) return { error: "Only the room creator can do that." };

  await prisma.roomMember.updateMany({
    where: { id: memberId, roomId, status: "PENDING" },
    data: { status: "ACTIVE" },
  });

  refresh(roomId);
  return { success: true };
}

// Rejecting removes the request, so the person may apply again later.
export async function rejectMember(
  roomId: string,
  memberId: string
): Promise<ActionResult> {
  const guard = await getManageableRoom(roomId);
  if (!guard) return { error: "Only the room creator can do that." };

  await prisma.roomMember.deleteMany({
    where: { id: memberId, roomId, status: "PENDING" },
  });

  refresh(roomId);
  return { success: true };
}

export async function saveJoinForm(
  roomId: string,
  questions: { id?: string; label: string; required: boolean }[]
): Promise<ActionResult> {
  const guard = await getManageableRoom(roomId);
  if (!guard) return { error: "Only the room creator can do that." };

  const cleaned = questions
    .map((q) => ({
      id: q.id,
      label: String(q.label ?? "").trim().slice(0, MAX_LABEL),
      required: !!q.required,
    }))
    .filter((q) => q.label.length > 0)
    .slice(0, MAX_QUESTIONS);

  const keepIds = cleaned.filter((q) => q.id).map((q) => q.id as string);

  await prisma.$transaction([
    // Removed questions (and their answers) go away; kept ones keep answers.
    prisma.joinQuestion.deleteMany({
      where: { roomId, id: { notIn: keepIds } },
    }),
    ...cleaned.map((q, position) =>
      q.id
        ? prisma.joinQuestion.updateMany({
            where: { id: q.id, roomId },
            data: { label: q.label, required: q.required, position },
          })
        : prisma.joinQuestion.create({
            data: { roomId, label: q.label, required: q.required, position },
          })
    ),
  ]);

  const saved = await prisma.joinQuestion.findMany({
    where: { roomId },
    orderBy: { position: "asc" },
    select: { id: true, label: true, required: true },
  });

  refresh(roomId);
  return { success: true, questions: saved };
}

export async function deleteRoom(
  roomId: string,
  confirmName: string
): Promise<ActionResult> {
  const guard = await getManageableRoom(roomId);
  if (!guard) return { error: "Only the room creator can do that." };

  if (confirmName.trim() !== guard.room.name) {
    return { error: "Room name doesn't match." };
  }

  // Members, messages, join questions and answers cascade (see schema.prisma).
  await prisma.room.delete({ where: { id: roomId } });

  refresh();
  redirect("/rooms");
}
