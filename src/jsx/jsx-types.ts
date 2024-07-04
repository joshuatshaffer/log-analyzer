export type Key = string | number | bigint;

export type FunctionComponent<P> = (props: P) => Node;

export type ElementType = keyof IntrinsicElements | FunctionComponent<any>;

export class Element<P, T extends ElementType> {
  constructor(
    public readonly type: T,
    public readonly props: P,
    public readonly key?: Key
  ) {}
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
