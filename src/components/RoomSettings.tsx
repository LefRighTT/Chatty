"use client";

import { useState, useTransition } from "react";
import {
  approveMember,
  deleteRoom,
  regenerateInviteCode,
  rejectMember,
  saveJoinForm,
  setJoinMode,
  setRoomPrivacy,
  type ActionResult,
} from "@/app/actions/rooms";

interface AnswerView {
  label: string;
  value: string;
}

interface Props {
  roomId: string;
  roomName: string;
  isPrivate: boolean;
  requireApproval: boolean;
  initialQuestions: { id: string; label: string; required: boolean }[];
  pendingRequests: { memberId: string; name: string | null; answers: AnswerView[] }[];
  memberAnswers: { name: string | null; answers: AnswerView[] }[];
}

type Draft = { key: string; id?: string; label: string; required: boolean };

let draftCounter = 0;
const newKey = () => `new-${++draftCounter}`;

const sectionTitle = "text-xs font-medium uppercase tracking-wide text-foreground-muted";
const outlineBtn =
  "rounded-lg border border-border-subtle px-3 py-1.5 text-xs text-foreground-muted transition hover:border-accent-amber hover:text-foreground disabled:opacity-50";

export default function RoomSettings({
  roomId,
  roomName,
  isPrivate,
  requireApproval,
  initialQuestions,
  pendingRequests,
  memberAnswers,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>(
    initialQuestions.map((q) => ({ key: q.id, ...q }))
  );
  const [confirmName, setConfirmName] = useState("");

  const run = (fn: () => Promise<ActionResult | void>, okText?: string) => {
    setMessage(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
        return;
      }
      if (res?.questions) {
        setDrafts(res.questions.map((q) => ({ key: q.id, ...q })));
      }
      if (okText) setMessage({ type: "success", text: okText });
    });
  };

  const updateDraft = (index: number, patch: Partial<Draft>) =>
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-foreground-muted transition hover:border-accent-amber hover:text-foreground"
      >
        Manage
        {pendingRequests.length > 0 && (
          <span className="ml-2 rounded-full bg-accent-coral px-1.5 py-0.5 text-[10px] font-medium text-background">
            {pendingRequests.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-20 flex max-h-[75vh] w-80 flex-col gap-5 overflow-y-auto rounded-xl border border-border-subtle bg-background-card p-4 shadow-xl">
          {/* Pending requests */}
          {pendingRequests.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className={sectionTitle}>Join requests</p>
              {pendingRequests.map((r) => (
                <div
                  key={r.memberId}
                  className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-background p-3"
                >
                  <p className="text-sm font-medium text-foreground">
                    {r.name ?? "Anonymous"}
                  </p>
                  {r.answers.length === 0 ? (
                    <p className="text-xs text-foreground-muted">No answers given.</p>
                  ) : (
                    r.answers.map((a, i) => (
                      <div key={i} className="text-xs">
                        <p className="text-foreground-muted">{a.label}</p>
                        <p className="whitespace-pre-line text-foreground">{a.value}</p>
                      </div>
                    ))
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() => approveMember(roomId, r.memberId), "Approved.")
                      }
                      className="rounded-lg bg-accent-amber px-3 py-1.5 text-xs font-medium text-background transition hover:bg-accent-amber-hover disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() => rejectMember(roomId, r.memberId), "Rejected.")
                      }
                      className={outlineBtn}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Visibility */}
          <section className="flex flex-col gap-2">
            <p className={sectionTitle}>Visibility</p>
            <p className="text-xs text-foreground-muted">
              {isPrivate
                ? "Private: only members and people with the invite code can find it."
                : "Public: anyone can find it and see its description."}
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(
                  () => setRoomPrivacy(roomId, !isPrivate),
                  isPrivate ? "Room is now public." : "Room is now private."
                )
              }
              className={outlineBtn}
            >
              {isPrivate ? "Make public" : "Make private"}
            </button>
          </section>

          {/* Invite code */}
          <section className="flex flex-col gap-2">
            <p className={sectionTitle}>Invite code</p>
            <p className="text-xs text-foreground-muted">
              Generating a new code stops the old one from working.
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => regenerateInviteCode(roomId), "New code generated.")}
              className={outlineBtn}
            >
              Generate new code
            </button>
          </section>

          {/* Join mode */}
          <section className="flex flex-col gap-2">
            <p className={sectionTitle}>How people join</p>
            <p className="text-xs text-foreground-muted">
              {requireApproval
                ? "Needs approval: people send a request and you approve or reject it."
                : "Instant: people get in as soon as they submit."}
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(
                  () => setJoinMode(roomId, !requireApproval),
                  requireApproval ? "Joining is now instant." : "Joining now needs approval."
                )
              }
              className={outlineBtn}
            >
              {requireApproval ? "Switch to instant join" : "Switch to needs approval"}
            </button>
          </section>

          {/* Join form */}
          <section className="flex flex-col gap-2">
            <p className={sectionTitle}>Join form</p>
            <p className="text-xs text-foreground-muted">
              Questions people answer before joining. Leave it empty for no form.
            </p>
            {drafts.map((d, i) => (
              <div key={d.key} className="flex items-center gap-2">
                <input
                  value={d.label}
                  maxLength={100}
                  onChange={(e) => updateDraft(i, { label: e.target.value })}
                  placeholder="Question"
                  className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-amber focus:outline-none"
                />
                <label className="flex items-center gap-1 whitespace-nowrap text-xs text-foreground-muted">
                  <input
                    type="checkbox"
                    checked={d.required}
                    onChange={(e) => updateDraft(i, { required: e.target.checked })}
                    className="accent-[var(--accent-amber)]"
                  />
                  Required
                </label>
                <button
                  type="button"
                  aria-label="Remove question"
                  onClick={() => setDrafts((prev) => prev.filter((_, j) => j !== i))}
                  className="text-foreground-muted transition hover:text-accent-coral"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={drafts.length >= 10}
                onClick={() =>
                  setDrafts((prev) => [
                    ...prev,
                    { key: newKey(), label: "", required: false },
                  ])
                }
                className={outlineBtn}
              >
                + Add question
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(
                    () =>
                      saveJoinForm(
                        roomId,
                        drafts.map((d) => ({
                          id: d.id,
                          label: d.label,
                          required: d.required,
                        }))
                      ),
                    "Join form saved."
                  )
                }
                className="rounded-lg bg-accent-amber px-3 py-1.5 text-xs font-medium text-background transition hover:bg-accent-amber-hover disabled:opacity-50"
              >
                Save form
              </button>
            </div>
          </section>

          {/* Answers from people already in */}
          {memberAnswers.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className={sectionTitle}>Member answers</p>
              {memberAnswers.map((m, i) => (
                <details key={i} className="rounded-lg border border-border-subtle bg-background px-3 py-2">
                  <summary className="cursor-pointer text-sm text-foreground">
                    {m.name ?? "Anonymous"}
                  </summary>
                  <div className="mt-2 flex flex-col gap-2">
                    {m.answers.map((a, j) => (
                      <div key={j} className="text-xs">
                        <p className="text-foreground-muted">{a.label}</p>
                        <p className="whitespace-pre-line text-foreground">{a.value}</p>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </section>
          )}

          {message && (
            <p
              className={`text-xs ${
                message.type === "error" ? "text-accent-coral" : "text-accent-amber"
              }`}
            >
              {message.text}
            </p>
          )}

          <div className="h-px bg-border-subtle" />

          {/* Danger zone */}
          <section className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-accent-coral">
              Delete room
            </p>
            <p className="text-xs text-foreground-muted">
              Permanently deletes the room, its messages and its members. This can&apos;t
              be undone. Type <span className="text-foreground">{roomName}</span> to confirm.
            </p>
            <input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={roomName}
              className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-coral focus:outline-none"
            />
            <button
              type="button"
              disabled={pending || confirmName.trim() !== roomName}
              onClick={() => run(() => deleteRoom(roomId, confirmName))}
              className="rounded-lg bg-accent-coral px-3 py-2 text-xs font-medium text-background transition hover:opacity-90 disabled:opacity-40"
            >
              Delete this room
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
