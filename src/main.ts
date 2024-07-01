import Fastify from "fastify";
import { getEntries } from "./journal-gateway";

const fastify = Fastify({ logger: true });

fastify.get("/", async (request, reply) => {
  const a = await getEntries();
  return a;
});

async function main() {
  await fastify.listen({ port: 3000 });
}

main().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
