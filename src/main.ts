import Fastify from "fastify";
import { ListJournalEntries } from "./ListJournalEntries";
import { renderElementToString } from "./jsx/jsx-render";
import { logger } from "./logger";

const fastify = Fastify({ logger });

fastify.get("/", async (request, reply) => {
  reply.header("Content-Type", "text/html");
  return (
    "<!DOCTYPE html>\n" + (await renderElementToString(ListJournalEntries()))
  );
});

async function main() {
  await fastify.listen({ port: 3000 });
}

main().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
