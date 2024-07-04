import Fastify from "fastify";
import { ListJournalEntries } from "./ListJournalEntries";
import { iterableToReadableStream } from "./iterableToReadableStream";
import { renderElement } from "./jsx/jsx-render";
import { Element } from "./jsx/jsx-types";
import { logger } from "./logger";

const fastify = Fastify({ logger });

fastify.addHook("preSerialization", (_request, reply, payload, done) => {
  if (payload instanceof Element) {
    reply.header("Content-Type", "text/html");
    reply.send(
      iterableToReadableStream(
        (async function* () {
          yield "<!DOCTYPE html>\n";
          yield* renderElement(payload);
        })()
      )
    );

    return;
  }

  done(null, payload);
});

fastify.get("/", async (request, reply) => {
  return ListJournalEntries();
});

async function main() {
  await fastify.listen({ port: 3000 });
}

main().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
