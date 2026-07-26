"use client";

import { useState, useTransition } from "react";
import { updateAvatarColor } from "@/app/actions/profile";
import Avatar, { PALETTE } from "@/components/Avatar";

interface Props {
  name: string | null;
  currentImage: string | null;
}

export default function AvatarPicker({ name, currentImage }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative"
        title="Change avatar color"
      >
        <Avatar name={name} image={currentImage} size={40} glow />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background-card text-[10px] text-foreground-muted ring-2 ring-background">
          ✎
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-20 flex gap-2 rounded-xl border border-border-subtle bg-background-card p-3 shadow-xl">
          {PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  await updateAvatarColor(color);
                  setOpen(false);
                });
              }}
              style={{ background: color }}
              className="h-7 w-7 rounded-full transition hover:scale-110 disabled:opacity-50"
            />
          ))}
        </div>
      )}
    </div>
  );
}