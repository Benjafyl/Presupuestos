import { getPrisma } from "@/lib/prisma";

export const QUOTE_TRASH_RETENTION_DAYS = 5;

export function quoteTrashExpiresAt(deletedAt = new Date()) {
  const expiresAt = new Date(deletedAt);
  expiresAt.setDate(expiresAt.getDate() + QUOTE_TRASH_RETENTION_DAYS);
  return expiresAt;
}

export async function purgeExpiredDeletedQuotes() {
  const now = new Date();
  await getPrisma().quote.deleteMany({
    where: {
      deletedAt: { not: null },
      deleteExpiresAt: { lte: now },
    },
  });
}

export function daysUntilDelete(expiresAt: Date | null) {
  if (!expiresAt) return QUOTE_TRASH_RETENTION_DAYS;

  const diffMs = expiresAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 86_400_000));
}
