import Fastify, { FastifyReply } from "fastify";
import { ListJournalEntries } from "./ListJournalEntries";
import { iterableToReadableStream } from "./iterableToReadableStream";
import { renderElement, renderElementToString } from "./jsx/jsx-render";
import { Element, ElementType, isElement } from "./jsx/jsx-types";
import { logger } from "./logger";

const fastify = Fastify({ logger });

fastify.addHook("preSerialization", (_request, reply, payload, done) => {
  if (isElement(payload)) {
    reply.header("content-type", "text/html");
    // TODO: Use a stream.
    renderElementToString(payload).then((html) => {
      reply.send("<!DOCTYPE html>\n" + html);
    });

    return;
  }

  done(null, payload);
});

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
  return ListJournalEntries();
});

async function main() {
  await fastify.listen({ port: 3000 });
}

main().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
