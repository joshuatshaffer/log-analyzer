import { Element, ElementType, IntrinsicElements, Node } from "./jsx-types";

export async function renderElementToString<P, T extends ElementType>(
  element: Element<P, T>
): Promise<string> {
  let result = "";
  for await (const chunk of renderElement(element)) {
    result += chunk;
  }
  return result;
}

export async function* renderElement<P, T extends ElementType>(
  element: Element<P, T>
): AsyncIterable<string> {
  if (typeof element.type === "string") {
    const { key, children, ...props } =
      element.props as IntrinsicElements[keyof IntrinsicElements];

    yield "<" + element.type;

    for (const [name, value] of Object.entries(props)) {
      yield ` ${name}="${value}"`;
    }

    if (children) {
      yield ">";
      yield* renderNode(children);
      yield `</${element.type}>`;
    } else {
      yield " />";
    }

    return;
  }

  if (typeof element.type === "function") {
    yield* renderNode(await element.type(element.props));

    return;
  }

  throw new Error(`Unsupported type: ${element.type}`);
}

async function* renderNode(node: Node): AsyncIterable<string> {
  if (node === null || node === undefined) {
    return;
  }

  if (typeof node === "number" || typeof node === "string") {
    yield "" + node;
    return;
  }

  if (isIterable(node)) {
    for (const n of node) {
      yield* renderNode(n);
    }
    return;
  }

  if (isAsyncIterable(node)) {
    for await (const n of node) {
      yield* renderNode(n);
    }
    return;
  }

  if (isPromiseLike(node)) {
    yield* renderNode(await node);
    return;
  }

  yield* renderElement(node);
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as PromiseLike<unknown>)?.then === "function";
}

function isIterable(value: unknown): value is Iterable<unknown> {
  return typeof (value as Iterable<unknown>)?.[Symbol.iterator] === "function";
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return (
    typeof (value as AsyncIterable<unknown>)?.[Symbol.asyncIterator] ===
    "function"
  );
}
