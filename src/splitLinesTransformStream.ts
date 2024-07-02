import { TransformStream } from "node:stream/web";

export function splitLinesTransformStream() {
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
