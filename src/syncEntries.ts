import { desc } from "drizzle-orm";
import { db } from "./db/db";
import { journalEntries } from "./db/schema";
import { streamEntries } from "./journal-gateway";
import { logger } from "./logger";

export async function syncEntries() {
  const existingEntries = await db
    .select()
    .from(journalEntries)
    .orderBy(desc(journalEntries.id))
    .limit(1);

  const latestEntry = existingEntries[0];

  const entries = await streamEntries({
    range: {
      take: 20000,
      ...(latestEntry
        ? {
            start: latestEntry.cursor,
            skip: 1,
          }
        : undefined),
    },
  });

  let insertBatch: { cursor: string; fields: unknown }[] = [];

  for await (const entry of entries) {
    const cursor = (entry.data as Record<string, string>).__CURSOR;
    if (typeof cursor !== "string") {
      logger.error({ journalEntry: entry.data }, "Invalid cursor");
      continue;
    }

    insertBatch.push({ cursor, fields: entry.data });

    if (insertBatch.length >= 100) {
      await db.insert(journalEntries).values(insertBatch);
      insertBatch = [];
    }
  }

  if (insertBatch.length > 0) {
    await db.insert(journalEntries).values(insertBatch);
    insertBatch = [];
  }

  setTimeout(() => {
    syncEntries();
  }, 10);
}
