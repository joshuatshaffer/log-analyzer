import { desc } from "drizzle-orm";
import Fastify from "fastify";
import { db } from "./db/db";
import { journalEntries } from "./db/schema";
import { streamEntries } from "./journal-gateway";
import { logger } from "./logger";

async function syncEntries() {
  const existingEntries = await db
    .select()
    .from(journalEntries)
    .orderBy(desc(journalEntries.id))
    .limit(1);

  const latestEntry = existingEntries[0];

  const entries = await streamEntries({
    range: {
      take: 20_000,
      ...(latestEntry
        ? {
            start: latestEntry.cursor,
            skip: 1,
          }
        : undefined),
    },
  });

  for await (const entry of entries) {
    const cursor = (entry.data as Record<string, string>).__CURSOR;
    if (typeof cursor !== "string") {
      logger.error({ journalEntry: entry.data }, "Invalid cursor");
      continue;
    }

    await db.insert(journalEntries).values({ cursor, fields: entry.data });
  }

  setTimeout(() => {
    syncEntries();
  }, 10);
}

syncEntries();

const fastify = Fastify({ logger });

fastify.get("/", async (request, reply) => {
  return await db.select().from(journalEntries).limit(10);
});

async function main() {
  await fastify.listen({ port: 3000 });
}

main().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
