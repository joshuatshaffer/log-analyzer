import {
  TextDecoderStream,
  TransformStream,
  TransformStreamDefaultController,
} from "node:stream/web";

const gatewayUrl = new URL(
  process.env.JOURNAL_GATEWAY_URL ?? "https://systemd-journal-gatewayd.example/"
);

const entriesUrl = new URL("entries", gatewayUrl);

const username = process.env.JOURNAL_GATEWAY_USERNAME ?? "john-doe";
const password = process.env.JOURNAL_GATEWAY_PASSWORD ?? "example password";

const Authorization =
  "Basic " + Buffer.from(username + ":" + password).toString("base64");

function rangeEntries({ start = "", skip = 0, take = 200 } = {}) {
  return `entries=${start}${skip ? `:${skip}` : ""}:${take}`;
}

export async function getEntries({
  range,
}: { range?: { start?: string; skip?: number; take?: number } } = {}) {
  const response = await fetch(entriesUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization,
      Range: rangeEntries(range),
    },
  });

  const text = await response.text();

  return text
    .split("\n")
    .filter((x) => x)
    .map((line) => JSON.parse(line));
}

export async function streamEntries({
  range,
}: { range?: { start?: string; skip?: number; take?: number } } = {}) {
  const response = await fetch(entriesUrl, {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
      Authorization,
      Range: rangeEntries(range),
    },
  });

  const body = response.body;

  if (!body) {
    throw new Error("No body");
  }

  for await (const text of response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(transformLinesStream())
    .pipeThrough(parseSseStream())) {
    console.log(text);
  }
}

function transformLinesStream() {
  let buffer = "";

  return new TransformStream<string, string>({
    transform(chunk, controller) {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        controller.enqueue(line);
      }
    },

    flush(controller) {
      if (buffer) {
        controller.enqueue(buffer);
      }
    },
  });
}

interface SseEvent {
  event: string;
  data: unknown;
}

function parseSseStream() {
  let event: string = "message";
  let lines: string[] = [];

  const flush = (controller: TransformStreamDefaultController<SseEvent>) => {
    if (lines.length === 0) {
      return;
    }
    const data = lines.join("\n");
    lines = [];
    controller.enqueue({ event, data: JSON.parse(data) });
  };

  return new TransformStream<string, SseEvent>({
    transform(line, controller) {
      if (line === "") {
        flush(controller);
        return;
      }

      {
        const eMatch = line.match(/^event: (.*)/);
        if (eMatch?.[1]) {
          event = eMatch[1];
          return;
        }
      }

      {
        const dMatch = line.match(/^data: (.*)/);
        if (dMatch?.[1]) {
          lines.push(dMatch[1]);
          return;
        }
      }

      console.warn("Unknown line", line);
    },

    flush(controller) {
      flush(controller);
    },
  });
}
