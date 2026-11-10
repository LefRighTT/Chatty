import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isSiteOwner } from "@/lib/permissions";
import ChatRoom from "@/components/ChatRoom";
import RoomInvite from "@/components/RoomInvite";
import RoomSettings from "@/components/RoomSettings";
import JoinRoomForm from "@/components/JoinRoomForm";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
}

async function getRoom(id: string) {
  return await prisma.room.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true } },
      questions: { orderBy: { position: "asc" } },
      members: {
        include: {
          user: { select: { name: true, image: true } },
        },
      },
    },
  });
}

// Latest 50 messages, oldest first.
async function getRecentMessages(roomId: string) {
  const rows = await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { sender: { select: { name: true, image: true } } },
  });
  return rows.reverse();
}

// Answers are only loaded for the creator / site owner.
async function getMemberAnswers(roomId: string) {
  const rows = await prisma.roomMember.findMany({
    where: { roomId, answers: { some: {} } },
    include: {
      user: { select: { name: true } },
      answers: {
        include: { question: { select: { label: true, position: true } } },
      },
    },
  });
  return rows.map((m) => ({
    memberId: m.id,
    status: m.status,
    name: m.user.name,
    answers: m.answers
      .sort((a, b) => a.question.position - b.question.position)
      .map((a) => ({ label: a.question.label, value: a.value })),
  }));
}

export default async function RoomPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const userId = session.user.id;

  const { id } = await params;
  const { code } = await searchParams;

  const room = await getRoom(id);
  if (!room) notFound();

  const owner = isSiteOwner(session.user.email);
  const myMembership = room.members.find((m) => m.userId === userId);
  const isMember = myMembership?.status === "ACTIVE";
  const activeMembers = room.members.filter((m) => m.status === "ACTIVE");
  const canManage = room.creatorId === userId || owner;

  // ---- Not in the room yet -------------------------------------------------
  if (!isMember && !owner) {
    // Applied to a "needs approval" room and waiting.
    if (myMembership?.status === "PENDING") {
      return (
        <main className="flex min-h-screen items-center justify-center px-6">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border-subtle bg-background-card p-10 text-center shadow-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-amber">
              Request sent
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl italic text-foreground">
              {room.name}
            </h1>
            <p className="text-sm text-foreground-muted">
              The creator will review your request. Check back soon.
            </p>
            <Link
              href="/rooms"
              className="text-sm text-foreground-muted hover:text-foreground"
            >
              ← Back to rooms
            </Link>
          </div>
        </main>
      );
    }

    const codeOk =
      !!code &&
      !!room.inviteCode &&
      code.toUpperCase() === room.inviteCode.toUpperCase();

    // Private rooms are invisible without the invite code.
    if (room.isPrivate && !codeOk) redirect("/rooms");

    // Preview: description first, then the person decides whether to join.
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-border-subtle bg-background-card p-10 shadow-2xl">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-amber">
              {room.isPrivate ? "Private room" : "Public room"}
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl italic text-foreground">
              {room.name}
            </h1>
            <p className="font-mono text-xs text-foreground-muted">
              {activeMembers.length} members
              {room.creator?.name ? ` · created by ${room.creator.name}` : ""}
            </p>
          </div>

          <p className="whitespace-pre-line text-sm text-foreground-muted">
            {room.description?.trim() || "This room has no description yet."}
          </p>

          <JoinRoomForm
            roomId={room.id}
            code={codeOk ? code! : ""}
            requireApproval={room.requireApproval}
            questions={room.questions.map((q) => ({
              id: q.id,
              label: q.label,
              required: q.required,
            }))}
          />

          <Link
            href="/rooms"
            className="text-center text-sm text-foreground-muted hover:text-foreground"
          >
            ← Back to rooms
          </Link>
        </div>
      </main>
    );
  }

  // ---- In the room ---------------------------------------------------------
  const messages = await getRecentMessages(room.id);
  const answers = canManage ? await getMemberAnswers(room.id) : [];
  const pendingRequests = answers.filter((a) => a.status === "PENDING");
  // Pending applicants with no answers still need to show up as requests.
  const pendingWithoutAnswers = canManage
    ? room.members
        .filter(
          (m) =>
            m.status === "PENDING" &&
            !pendingRequests.some((p) => p.memberId === m.id)
        )
        .map((m) => ({
          memberId: m.id,
          status: m.status,
          name: m.user.name,
          answers: [] as { label: string; value: string }[],
        }))
    : [];
  const allPending = [...pendingRequests, ...pendingWithoutAnswers];
  const memberAnswers = answers.filter((a) => a.status === "ACTIVE");

  return (
    <main className="flex flex-col h-screen max-w-3xl mx-auto">
      <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-[family-name:var(--font-display)] text-lg text-foreground">
              {room.name}
            </h1>
            {room.isPrivate && (
              <span className="rounded-full border border-border-subtle px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground-muted">
                Private
              </span>
            )}
          </div>
          <p className="text-sm text-foreground-muted">
            {activeMembers.length} members
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canManage && (
            <RoomSettings
              roomId={room.id}
              roomName={room.name}
              isPrivate={room.isPrivate}
              requireApproval={room.requireApproval}
              initialQuestions={room.questions.map((q) => ({
                id: q.id,
                label: q.label,
                required: q.required,
              }))}
              pendingRequests={allPending.map((p) => ({
                memberId: p.memberId,
                name: p.name,
                answers: p.answers,
              }))}
              memberAnswers={memberAnswers.map((m) => ({
                name: m.name,
                answers: m.answers,
              }))}
            />
          )}
          <RoomInvite roomId={room.id} inviteCode={room.inviteCode ?? "—"} />
          <a
            href="/rooms"
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            ← All rooms
          </a>
        </div>
      </div>

      <ChatRoom
        roomId={room.id}
        userId={userId}
        userName={session.user.name ?? "Anonymous"}
        userImage={session.user.image ?? ""}
        initialMessages={messages}
        members={activeMembers}
      />
    </main>
  );
}
