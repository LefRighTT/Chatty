"use client";

import { useActionState } from "react";
import { joinRoomByCode } from "@/app/actions/rooms";

export default function JoinByCode() {
  const [state, formAction, pending] = useActionState(
    joinRoomByCode,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          type="text"
          name="code"
          placeholder="Have an invite code?"
          className="w-44 rounded-xl border border-border-subtle bg-background-card px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-amber focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="whitespace-nowrap rounded-xl border border-border-subtle px-4 py-2.5 text-sm text-foreground-muted transition hover:border-accent-amber hover:text-foreground disabled:opacity-50"
        >
          Join
        </button>
      </div>
      {state?.error && (
        <p className="text-xs text-accent-coral">{state.error}</p>
      )}
    </form>
  );
}