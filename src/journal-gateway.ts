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

interface SseEvent<T> {
  type: string;
  data: T;
}

/**
 * @see https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
 */
function parseSseStream<T>({
  parseData = JSON.parse,
}: { parseData?: (data: string) => T } = {}) {
  const newBuffer = () => ({
    event: "",
    data: "",
  });

  let buffer = newBuffer();

  const dispatchEvent = (
    controller: TransformStreamDefaultController<SseEvent<T>>
  ) => {
    if (buffer.data === "") {
      buffer = newBuffer();
      return;
    }

    if (buffer.data.endsWith("\n")) {
      buffer.data = buffer.data.slice(0, -1);
    }

    controller.enqueue({
      type: buffer.event || "message",
      data: parseData(buffer.data),
    });

    buffer = newBuffer();
  };

  return new TransformStream<string, SseEvent<T>>({
    transform(line, controller) {
      // Blank lines separate events.
      if (line === "") {
        dispatchEvent(controller);
        return;
      }

      // Ignore comments.
      if (line.startsWith(":")) {
        return;
      }

      // Field names must be followed by a colon, or the entire line is the
      // field name. The only fields we care about are "event" and "data".
      {
        const match = line.match(/^(event|data)(?:: ?(.*))?$/);
        if (match) {
          const fieldName = match[1];
          const value = match[2] ?? "";
          if (fieldName === "event") {
            buffer.event = value;
          } else if (fieldName === "data") {
            buffer.data += value + "\n";
          }
          return;
        }
      }
    },

    flush(controller) {
      dispatchEvent(controller);
    },
  });
}
