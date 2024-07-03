import Fastify from "fastify";
import { db } from "./db/db";
import { journalEntries } from "./db/schema";
import { logger } from "./logger";

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
