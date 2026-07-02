import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ChatRoom from "@/components/ChatRoom";
import { joinRoom } from "@/app/actions/rooms";

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

  // Auto-join the room if not already a member
  await joinRoom(id);

  return (
    <main className="flex flex-col h-screen max-w-3xl mx-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h1 className="font-bold text-lg">{room.name}</h1>
          <p className="text-sm text-gray-500">
            {room.members.length} members
          </p>
        </div>
        <a href="/rooms" className="text-sm text-gray-500 hover:text-gray-900">
          ← All rooms
        </a>
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