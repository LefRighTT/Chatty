import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getRooms } from "@/app/actions/rooms";
import { handleSignOut } from "@/app/actions";
import Link from "next/link";
import AvatarPicker from "@/components/AvatarPicker";
import ThemeToggle from "@/components/ThemeToggle";
import JoinByCode from "@/components/JoinByCode";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function RoomsPage({ searchParams }: Props) {
  const session = await auth();

  if (!session) redirect("/");

  const { q } = await searchParams;
  const rooms = await getRooms(q);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AvatarPicker
              name={session.user?.name ?? null}
              currentImage={session.user?.image ?? null}
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                {session.user?.name}
              </p>
              <p className="text-xs text-foreground-muted">
                {session.user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={handleSignOut}>
              <button
                type="submit"
                className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-foreground-muted transition hover:border-accent-amber hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-foreground">
            Your rooms
          </h1>
          <Link
            href="/rooms/create"
            className="rounded-xl bg-accent-amber px-4 py-2 text-sm font-medium text-background transition hover:bg-accent-amber-hover"
          >
            + Create room
          </Link>
        </div>

        {/* Search + join by code */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <form action="/rooms" method="GET" className="flex-1">
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search public rooms..."
              className="w-full rounded-xl border border-border-subtle bg-background-card px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-amber focus:outline-none"
            />
          </form>
          <JoinByCode />
        </div>

        {/* Rooms list */}
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-subtle py-16 text-center">
            <p className="font-[family-name:var(--font-display)] text-xl italic text-foreground">
              {q ? "No rooms match that search." : "It's quiet in here."}
            </p>
            <p className="text-sm text-foreground-muted">
              {q
                ? "Try a different name, or create your own."
                : "Start the first room above — someone has to turn the lights on."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {rooms.map((room) => (
              <li key={room.id}>
                <Link
                  href={`/rooms/${room.id}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-border-subtle bg-background-card p-5 transition hover:border-accent-amber/60 hover:bg-background-card-hover"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {room.name}
                      </p>
                      {room.isPrivate && (
                        <span className="rounded-full border border-border-subtle px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground-muted">
                          Private
                        </span>
                      )}
                    </div>
                    <span className="text-foreground-muted transition group-hover:translate-x-1 group-hover:text-accent-amber">
                      →
                    </span>
                  </div>
                  {room.description && (
                    <p className="text-sm text-foreground-muted line-clamp-2">
                      {room.description}
                    </p>
                  )}
                  <p className="font-mono text-xs text-foreground-muted">
                    {room._count.members} members · {room._count.messages}{" "}
                    messages
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}