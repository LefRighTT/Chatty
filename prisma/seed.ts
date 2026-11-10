// Creates 6 public + 6 private dummy rooms owned by the site owner.
// Safe to run more than once (skips rooms that already exist).
//   npm run db:seed
// Requires OWNER_EMAIL in .env and that account to exist (sign in once first).
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { generateInviteCode } from "../src/lib/invite";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

interface Seed {
  name: string;
  description: string;
  isPrivate: boolean;
  requireApproval?: boolean;
  questions?: { label: string; required: boolean }[];
}

const ROOMS: Seed[] = [
  // ---- Public ----
  {
    name: "Late Night Lounge",
    description: "Can't sleep? Come hang out. Music, movies and random thoughts after midnight.",
    isPrivate: false,
  },
  {
    name: "Study Buddies",
    description: "Accountability room for students. Share what you're working on and study together.",
    isPrivate: false,
    questions: [
      { label: "What are you studying?", required: true },
      { label: "Your timezone", required: false },
    ],
  },
  {
    name: "Indie Game Devs",
    description: "Show off your prototypes, ask for feedback, find a teammate for the next game jam.",
    isPrivate: false,
    requireApproval: true,
    questions: [
      { label: "Link to something you've made", required: true },
      { label: "Which engine do you use?", required: false },
    ],
  },
  {
    name: "Pinoy Foodies",
    description: "Recipes, street food finds and the great sinigang debate.",
    isPrivate: false,
  },
  {
    name: "Fullstack Help Desk",
    description: "Stuck on a bug? Post it here. React, Next.js, Prisma, Laravel, Python: all welcome.",
    isPrivate: false,
    questions: [{ label: "What's your main stack?", required: false }],
  },
  {
    name: "Weekend Hikers",
    description: "Plan trails and group climbs around Bicol and beyond.",
    isPrivate: false,
  },
  // ---- Private ----
  {
    name: "Inner Circle",
    description: "Invite-only room for close friends.",
    isPrivate: true,
  },
  {
    name: "Thesis Squad",
    description: "Private room for thesis co-authors: drafts, deadlines and defense prep.",
    isPrivate: true,
    questions: [{ label: "Which section are you handling?", required: true }],
  },
  {
    name: "Project Nightlight",
    description: "Closed beta testers only. Report bugs and share feedback here.",
    isPrivate: true,
    requireApproval: true,
    questions: [
      { label: "Why do you want to join the beta?", required: true },
      { label: "Device / browser you'll test on", required: false },
    ],
  },
  {
    name: "Family Group",
    description: "Family updates and plans.",
    isPrivate: true,
  },
  {
    name: "Job Hunt Support",
    description: "Private space to swap referrals, resume tips and interview stories.",
    isPrivate: true,
    questions: [{ label: "What role are you aiming for?", required: false }],
  },
  {
    name: "Mods & Admins",
    description: "Moderator coordination. Not for general members.",
    isPrivate: true,
    requireApproval: true,
  },
];

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!ownerEmail) throw new Error("Set OWNER_EMAIL in .env first.");

  const owner = await prisma.user.findFirst({
    where: { email: { equals: ownerEmail, mode: "insensitive" } },
  });
  if (!owner) {
    throw new Error(
      `No user with email ${ownerEmail}. Sign in to the app once with that account, then re-run.`
    );
  }

  let created = 0;
  for (const seed of ROOMS) {
    const exists = await prisma.room.findFirst({
      where: { name: seed.name, creatorId: owner.id },
    });
    if (exists) continue;

    await prisma.room.create({
      data: {
        name: seed.name,
        description: seed.description,
        isPrivate: seed.isPrivate,
        requireApproval: seed.requireApproval ?? false,
        inviteCode: generateInviteCode(),
        creatorId: owner.id,
        members: { create: { userId: owner.id } },
        questions: {
          create: (seed.questions ?? []).map((q, position) => ({
            label: q.label,
            required: q.required,
            position,
          })),
        },
      },
    });
    created++;
  }
  console.log(`Seeded ${created} new rooms (${ROOMS.length - created} already existed).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
