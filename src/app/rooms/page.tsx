import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getRooms, createRoom } from "@/app/actions/rooms";
import { handleSignOut } from "@/app/actions";
import Link from "next/link";

export default async function RoomsPage() {
  const session = await auth();

  if (!session) redirect("/");

  const rooms = await getRooms();

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <img
            src={session.user?.image ?? ""}
            alt="avatar"
            className="w-8 h-8 rounded-full"
          />
          <div>
            <p className="font-medium text-sm">{session.user?.name}</p>
            <p className="text-xs text-gray-500">{session.user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Chat Rooms</h1>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="text-sm px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Create room form */}
      <form action={createRoom} className="flex gap-2 mb-8">
        <input
          type="text"
          name="name"
          placeholder="New room name..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Create
        </button>
      </form>

      {/* Rooms list */}
      {rooms.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          No rooms yet. Create one above!
        </p>
      ) : (
        <ul className="space-y-3">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                href={`/rooms/${room.id}`}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-medium">{room.name}</p>
                  <p className="text-sm text-gray-500">
                    {room._count.members} members · {room._count.messages} messages
                  </p>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}