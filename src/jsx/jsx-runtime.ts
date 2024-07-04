import {
  ElementType,
  FunctionComponent,
  Key,
  Element as _Element,
  IntrinsicElements as _IntrinsicElements,
} from "./jsx-types";

export function jsx<T extends ElementType, P>(type: T, props: P, key?: Key) {
  return new _Element(type, props, key);
}

export const jsxs = jsx;

declare global {
  // See https://www.typescriptlang.org/docs/handbook/jsx.html
  namespace JSX {
    interface Element extends _Element<any, any> {}

    interface ElementClass extends FunctionComponent<any> {}

    interface ElementAttributesProperty {
      props: {};
    }

    interface ElementChildrenAttribute {
      children: {};
    }

    interface IntrinsicAttributes {
      key?: Key;
    }

    interface IntrinsicClassAttributes<ComponentClass> {}

    interface IntrinsicElements extends _IntrinsicElements {}
  }
}
