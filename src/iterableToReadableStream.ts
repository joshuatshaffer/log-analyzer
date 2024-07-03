import { ReadableStream } from "node:stream/web";

export function iterableToReadableStream<T>(
  iterable: Iterable<T> | AsyncIterable<T>
) {
  return new ReadableStream<T>({
    async start(controller) {
      for await (const chunk of iterable) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}
