import { ReadableWritablePair } from "node:stream/web";

export function concatTransformStreams<A, B, C>(
  a: ReadableWritablePair<B, A>,
  b: ReadableWritablePair<C, B>
): ReadableWritablePair<C, A> {
  return {
    readable: a.readable.pipeThrough(b),
    writable: a.writable,
  };
}
