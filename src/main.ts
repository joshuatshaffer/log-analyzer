import { desc } from "drizzle-orm";
import Fastify from "fastify";
import { db } from "./db/db";
import { journalEntries } from "./db/schema";
import { getEntries } from "./journal-gateway";
import { logger } from "./logger";

async function syncEntries() {
  const existingEntries = await db
    .select()
    .from(journalEntries)
    .orderBy(desc(journalEntries.id))
    .limit(1);

  const latestEntry = existingEntries[0];

  const entries = await getEntries({
    range: latestEntry
      ? {
          start: (latestEntry.fields as Record<string, string>)["__CURSOR"],
          skip: 1,
        }
      : undefined,
  });

  await db
    .insert(journalEntries)
    .values(entries.map((entry) => ({ fields: entry })));
}

setInterval(() => {
  syncEntries();
}, 1000);

const fastify = Fastify({ logger });

fastify.get("/", async (request, reply) => {
  return await db.select().from(journalEntries);
});

async function main() {
  await fastify.listen({ port: 3000 });
}

main().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
