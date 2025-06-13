declare module 'react' {
  export = React;
  export as namespace React;
}

declare namespace React {
  interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }

  type JSXElementConstructor<P> = ((props: P) => ReactElement | null) | (new (props: P) => Component<P, any>);

  interface ReactNode {
    [key: string]: any;
  }

  interface ReactPortal {
    [key: string]: any;
  }

  type ReactText = string | number;
  type ReactChild = ReactElement | ReactText;
  type ReactFragment = {} | Iterable<ReactNode>;
  type ReactNode = ReactChild | ReactFragment | ReactPortal | boolean | null | undefined;

  interface RefObject<T> {
    readonly current: T | null;
  }

  type Ref<T> = RefCallback<T> | RefObject<T> | null;
  type RefCallback<T> = (instance: T | null) => void;

  type Key = string | number;

  interface Component<P = {}, S = {}, SS = any> extends ComponentLifecycle<P, S, SS> {}

  interface ComponentLifecycle<P, S, SS = any> {}

  interface FunctionComponent<P = {}> {
    (props: P, context?: any): ReactElement<any, any> | null;
  }

  function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  function useEffect(effect: () => void | (() => void), deps?: any[]): void;
}

declare namespace JSX {
  interface Element extends React.ReactElement<any, any> { }
  interface IntrinsicElements {
    [elemName: string]: any;
  }
} 