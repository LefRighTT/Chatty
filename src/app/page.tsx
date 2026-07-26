import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AuthCard from "@/components/AuthCard";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const session = await auth();

  if (session) redirect("/rooms");

  const { error } = await searchParams;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* Ambient drifting glow orbs - the "lit windows at dusk" motif */}
      <div
        aria-hidden="true"
        className="ambient-drift absolute -top-24 -left-16 h-72 w-72 rounded-full bg-accent-amber/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="ambient-drift absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-accent-coral/15 blur-3xl"
        style={{ animationDelay: "3s" }}
      />
      <div
        aria-hidden="true"
        className="ambient-drift absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-accent-amber/10 blur-3xl"
        style={{ animationDelay: "6s" }}
      />

      {/* Faint grid of "lit windows" - small glowing squares suggesting a building at dusk */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid grid-cols-8 gap-10 p-10 opacity-[0.07]"
      >
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-sm"
            style={{
              background:
                i % 5 === 0 || i % 7 === 0 ? "var(--accent-amber)" : "transparent",
            }}
          />
        ))}
      </div>

      <AuthCard initialError={error} />
    </main>
  );
}