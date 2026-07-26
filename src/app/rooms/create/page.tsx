import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createRoom } from "@/app/actions/rooms";
import Link from "next/link";

export default async function CreateRoomPage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-border-subtle bg-background-card p-10 shadow-2xl">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-amber">
            New room
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl italic text-foreground">
            Set up your room
          </h1>
        </div>

        <form action={createRoom} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs text-foreground-muted">
              Room name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Late night lounge"
              className="rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-amber focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="description"
              className="text-xs text-foreground-muted"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="What's this room about?"
              className="resize-none rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-amber focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-border-subtle bg-background px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="isPrivate"
              className="h-4 w-4 accent-[var(--accent-amber)]"
            />
            <span className="flex flex-col">
              <span className="text-foreground">Make this room private</span>
              <span className="text-xs text-foreground-muted">
                Only people you invite can join
              </span>
            </span>
          </label>

          <div className="mt-2 flex gap-3">
            <Link
              href="/rooms"
              className="flex-1 rounded-xl border border-border-subtle px-6 py-3 text-center text-sm font-medium text-foreground-muted transition hover:text-foreground"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-accent-amber px-6 py-3 text-sm font-medium text-background transition hover:bg-accent-amber-hover"
            >
              Create room
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}