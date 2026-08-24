import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const staffEmail = process.env.SEED_STAFF_EMAIL || "loftindavoult@gmail.com";
  const staffPassword = process.env.SEED_STAFF_PASSWORD || "changeme123";

  // update: {} means this never touches an existing account (including its
  // password or role) — it only creates the login the very first time the
  // app runs, as an admin.
  await db.staffUser.upsert({
    where: { email: staffEmail },
    update: {},
    create: {
      email: staffEmail,
      name: "Lykos Admin",
      role: "admin",
      passwordHash: await bcrypt.hash(staffPassword, 10),
    },
  });
  console.log(`Staff user ready: ${staffEmail} / ${staffPassword}`);

  // Phase 2 renamed the stage taxonomy (Lead -> Cold Lead, Contacted -> Warm
  // Lead) so any accounts created under the old names before this shipped
  // don't silently vanish from the new Kanban board. Idempotent: once
  // remapped, no rows match the old names again.
  await db.account.updateMany({ where: { stage: "Lead" }, data: { stage: "Cold Lead" } });
  await db.account.updateMany({ where: { stage: "Contacted" }, data: { stage: "Warm Lead" } });

  // Self-healing: if a database predates the admin/staff role split (or an
  // admin was somehow removed), promote the earliest-created login so the
  // team always has at least one admin able to manage other logins.
  const adminCount = await db.staffUser.count({ where: { role: "admin" } });
  if (adminCount === 0) {
    const earliest = await db.staffUser.findFirst({ orderBy: { createdAt: "asc" } });
    if (earliest) {
      await db.staffUser.update({ where: { id: earliest.id }, data: { role: "admin" } });
      console.log(`Promoted ${earliest.email} to admin (no admin existed).`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
