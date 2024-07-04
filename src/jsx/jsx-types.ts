export type Key = string | number | bigint;

export type FunctionComponent<P> = (props: P) => Node;

export type ElementType = keyof IntrinsicElements | FunctionComponent<any>;

export const isElementSym = Symbol("isElement");

export interface Element<P, T extends ElementType> {
  [isElementSym]: true;
  type: T;
  props: P;
  key?: Key;
}

export function isElement(
  value: unknown
): value is Element<unknown, ElementType> {
  return (value as Element<any, any>)[isElementSym] === true;
}

type NodePrimitive = string | number | null | undefined | Element<any, any>;

type NodeNonPromise = NodePrimitive | Iterable<Node> | AsyncIterable<Node>;

export type Node = NodeNonPromise | PromiseLike<NodeNonPromise>;

export interface IntrinsicElements {
  [key: string]: {
    key?: Key;
    children?: Node;
    [attribute: string]: unknown;
  };
}
