// Run with Node 22+: node --experimental-strip-types --env-file=.env scripts/normalize-branches.mjs [--apply]
// Preview by default. Apply keeps a backup and leaves all quote contents unchanged.
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { uniqueBranches } from "../src/lib/client-branches.ts";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

function plan(clients) {
  return clients.flatMap((client) => uniqueBranches(client.branches).flatMap((group) => {
    const original = client.branches.find((branch) => branch.id === group.id);
    const duplicateIds = group.memberIds.filter((id) => id !== group.id);
    return duplicateIds.length || original.branch !== group.branch
      ? [{ client: client.name, id: group.id, name: group.branch, duplicateIds }]
      : [];
  }));
}

try {
  if (!apply) {
    console.log(JSON.stringify(plan(await prisma.client.findMany({ include: { branches: true } })), null, 2));
  } else {
    await prisma.$transaction(async (tx) => {
      // The backup, plan and updates must describe the same database snapshot.
      await tx.$executeRaw`LOCK TABLE "Client", "ClientBranch", "Quote" IN SHARE ROW EXCLUSIVE MODE`;
      const clients = await tx.client.findMany({ include: { branches: true } });
      const changes = plan(clients);
      if (!changes.length) {
        console.log("No hay sucursales duplicadas que corregir.");
        return;
      }
      const quotes = await tx.quote.findMany({ orderBy: { id: "asc" } });
      await mkdir("output/backups", { recursive: true });
      const backup = `output/backups/branches-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      await writeFile(backup, JSON.stringify({ clients, quotes, changes }, null, 2), { flag: "wx" });
      for (const change of changes) {
        for (const id of change.duplicateIds) {
          // Raw update deliberately preserves Quote.updatedAt and all document fields.
          await tx.$executeRaw`UPDATE "Quote" SET "clientBranchId" = ${change.id} WHERE "clientBranchId" = ${id}`;
        }
        await tx.clientBranch.deleteMany({ where: { id: { in: change.duplicateIds } } });
        await tx.clientBranch.update({ where: { id: change.id }, data: { branch: change.name } });
      }
      const after = await tx.quote.findMany({ orderBy: { id: "asc" } });
      const contents = (rows) => JSON.stringify(rows.map((quote) => ({ ...quote, clientBranchId: null })));
      if (contents(quotes) !== contents(after)) throw new Error("Cambió el contenido de un presupuesto; se revierte la transacción.");
      console.log(JSON.stringify({ backup, preservedQuotes: after.length, removedDuplicates: changes.reduce((n, c) => n + c.duplicateIds.length, 0), changes }, null, 2));
    }, { timeout: 30000 });
  }
} finally {
  await prisma.$disconnect();
}
