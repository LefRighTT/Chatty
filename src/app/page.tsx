import { auth } from "@/auth";
import { handleSignIn } from "@/app/actions";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session) redirect("/rooms");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Realtime Chat</h1>
      <p className="text-gray-500">Sign in to start chatting</p>
      <form action={handleSignIn}>
        <button
          type="submit"
          className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Sign in with GitHub
        </button>
      </form>
    </main>
  );
}