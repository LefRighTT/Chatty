"use client";

import { useState, useTransition } from "react";
import { inviteUserByEmail } from "@/app/actions/rooms";

interface Props {
  roomId: string;
  inviteCode: string;
}

export default function RoomInvite({ roomId, inviteCode }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const submitInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    startTransition(async () => {
      const result = await inviteUserByEmail(roomId, email.trim());
      if (result?.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Invited!" });
        setEmail("");
      }
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-foreground-muted transition hover:border-accent-amber hover:text-foreground"
      >
        Invite
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-20 flex w-72 flex-col gap-4 rounded-xl border border-border-subtle bg-background-card p-4 shadow-xl">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-foreground-muted">Invite code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground">
                {inviteCode}
              </code>
              <button
                type="button"
                onClick={copyCode}
                className="rounded-lg bg-accent-amber px-3 py-2 text-xs font-medium text-background transition hover:bg-accent-amber-hover"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="h-px bg-border-subtle" />

          <form onSubmit={submitInvite} className="flex flex-col gap-2">
            <p className="text-xs text-foreground-muted">Invite by email</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@email.com"
                className="flex-1 rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-amber focus:outline-none"
              />
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg border border-border-subtle px-3 py-2 text-xs text-foreground-muted transition hover:border-accent-amber hover:text-foreground disabled:opacity-50"
              >
                Send
              </button>
            </div>
            {message && (
              <p
                className={`text-xs ${
                  message.type === "error"
                    ? "text-accent-coral"
                    : "text-accent-amber"
                }`}
              >
                {message.text}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}