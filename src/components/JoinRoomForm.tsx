"use client";

import { useActionState } from "react";
import { requestJoin } from "@/app/actions/rooms";

interface Question {
  id: string;
  label: string;
  required: boolean;
}

interface Props {
  roomId: string;
  code: string;
  questions: Question[];
  requireApproval: boolean;
}

export default function JoinRoomForm({
  roomId,
  code,
  questions,
  requireApproval,
}: Props) {
  const [state, formAction, pending] = useActionState(requestJoin, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="roomId" value={roomId} />
      <input type="hidden" name="code" value={code} />

      {questions.length > 0 && (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-amber">
          Before you join
        </p>
      )}

      {requireApproval && (
        <p className="rounded-xl border border-border-subtle bg-background px-4 py-3 text-xs text-foreground-muted">
          The creator reviews every request. You&apos;ll get in once they approve.
        </p>
      )}

      {questions.map((q) => (
        <div key={q.id} className="flex flex-col gap-1.5">
          <label htmlFor={`q_${q.id}`} className="text-xs text-foreground-muted">
            {q.label}
            {q.required ? (
              <span className="text-accent-coral"> *</span>
            ) : (
              " (optional)"
            )}
          </label>
          <textarea
            id={`q_${q.id}`}
            name={`q_${q.id}`}
            rows={2}
            maxLength={500}
            required={q.required}
            className="resize-none rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-amber focus:outline-none"
          />
        </div>
      ))}

      {state?.error && <p className="text-xs text-accent-coral">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent-amber px-6 py-3 text-sm font-medium text-background transition hover:bg-accent-amber-hover disabled:opacity-60"
      >
        {pending
          ? "Sending..."
          : requireApproval
            ? "Request to join"
            : "Join room"}
      </button>
    </form>
  );
}
