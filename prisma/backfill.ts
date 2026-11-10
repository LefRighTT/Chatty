// One-off: gives old rooms a creator and a proper invite code.
// Run once after `npx prisma db push`:  npm run db:backfill
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { generateInviteCode } from "../src/lib/invite";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // 1) Rooms with no invite code (that's the "—" you saw in the UI)
  const noCode = await prisma.room.findMany({
    where: { inviteCode: null },
    select: { id: true },
  });
  for (const room of noCode) {
    await prisma.room.update({
      where: { id: room.id },
      data: { inviteCode: generateInviteCode() },
    });
  }
  console.log(`Invite codes added: ${noCode.length}`);

  // 2) Rooms with no creator: the earliest member is treated as the creator
  //    (createRoom always added the creator as the first member).
  const noCreator = await prisma.room.findMany({
    where: { creatorId: null },
    select: { id: true },
  });
  let fixed = 0;
  for (const room of noCreator) {
    const first = await prisma.roomMember.findFirst({
      where: { roomId: room.id },
      orderBy: { id: "asc" }, // cuids sort by creation time
      select: { userId: true },
    });
    if (first) {
      await prisma.room.update({
        where: { id: room.id },
        data: { creatorId: first.userId },
      });
      fixed++;
    }
  }
  console.log(`Creators assigned: ${fixed} of ${noCreator.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
