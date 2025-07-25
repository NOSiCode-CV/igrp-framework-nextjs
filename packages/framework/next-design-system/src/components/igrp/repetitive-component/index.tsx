import { Fragment, type ReactNode } from 'react';

interface IGRPRepetitiveComponentProps<T> {
  items: T[];
  children: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
}

function IGRPRepetitiveComponent<T>({
  items,
  children,
  keyExtractor,
}: IGRPRepetitiveComponentProps<T>) {
  return items.map((item) => <Fragment key={keyExtractor(item)}>{children(item)}</Fragment>);
}

export { IGRPRepetitiveComponent, type IGRPRepetitiveComponentProps };
