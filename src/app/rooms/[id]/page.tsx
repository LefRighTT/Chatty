import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ChatRoom from "@/components/ChatRoom";
import { joinRoom } from "@/app/actions/rooms";
import RoomInvite from "@/components/RoomInvite";

interface Props {
  params: Promise<{ id: string }>;
}

async function getRoom(id: string) {
  return await prisma.room.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 50,
        include: {
          sender: {
            select: { name: true, image: true },
          },
        },
      },
      members: {
        include: {
          user: {
            select: { name: true, image: true },
          },
        },
      },
    },
  });
}

export default async function RoomPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/");

  const { id } = await params;
  const room = await getRoom(id);
  if (!room) notFound();

  // Private rooms: only members should land here. A non-member hitting a
  // private room's URL directly gets redirected back, rather than silently
  // auto-joining like public rooms do.
  if (room.isPrivate) {
    const alreadyMember = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: { userId: session.user.id, roomId: room.id },
      },
    });
    if (!alreadyMember) redirect("/rooms");
  } else {
    // Auto-join for public rooms only
    await joinRoom(id);
  }

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
            {room.members.length} members
          </p>
        </div>
        <div className="flex items-center gap-3">
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
        userId={session.user.id}
        userName={session.user.name ?? "Anonymous"}
        userImage={session.user.image ?? ""}
        initialMessages={room.messages}
        members={room.members}
      />
    </main>
  );
}