export type Key = string | number | bigint;

export type FunctionComponent<P> = (props: P) => Node;

export type ElementType = keyof IntrinsicElements | FunctionComponent<any>;

export interface Element<P, T extends ElementType> {
  type: T;
  props: P;
  key?: Key;
}

export type Node = _Node | PromiseLike<_Node>;
type _Node = string | number | Element<any, any> | null | undefined | Node[];

export interface IntrinsicElements {
  [key: string]: {
    key?: Key;
    children?: Node;
    [attribute: string]: unknown;
  };
}
