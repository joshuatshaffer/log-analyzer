import Fastify, { FastifyReply } from "fastify";
import { ListJournalEntries } from "./ListJournalEntries";
import { iterableToReadableStream } from "./iterableToReadableStream";
import { renderElement } from "./jsx/jsx-render";
import { Element, ElementType } from "./jsx/jsx-types";
import { logger } from "./logger";

const fastify = Fastify({ logger });

function sendElement(
  reply: FastifyReply,
  element: Element<unknown, ElementType>
) {
  reply.header("Content-Type", "text/html");
  return iterableToReadableStream(
    (async function* () {
      yield "<!DOCTYPE html>\n";
      yield* renderElement(element);
    })()
  );
}

fastify.get("/", async (request, reply) => {
  sendElement(reply, ListJournalEntries());
});

async function main() {
  await fastify.listen({ port: 3000 });
}

main().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
