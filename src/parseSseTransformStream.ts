import {
  TransformStream,
  TransformStreamDefaultController,
} from "node:stream/web";
import { concatTransformStreams } from "./concatTransformStreams";
import { splitLinesTransformStream } from "./splitLinesTransformStream";

interface SseEvent<T> {
  type: string;
  data: T;
}

/**
 * @see https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
 */
export function parseSseTransformStream<T>({
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

  return concatTransformStreams(
    splitLinesTransformStream(),
    new TransformStream<string, SseEvent<T>>({
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
    })
  );
}
