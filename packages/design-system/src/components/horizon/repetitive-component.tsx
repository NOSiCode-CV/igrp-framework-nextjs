import { Fragment, useId, type ReactNode } from 'react';

interface IGRPRepetitiveComponentProps<T> {
  items: T[];
  children: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
  name?: string;
  id?: string;
}

function IGRPRepetitiveComponent<T>({
  items,
  children,
  keyExtractor,
  name,
  id,
}: IGRPRepetitiveComponentProps<T>) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  return (
    <div id={ref}>
      {items.map((item) => (
        <Fragment key={keyExtractor(item)}>{children(item)}</Fragment>
      ))}
    </div>
  );
}

export { IGRPRepetitiveComponent, type IGRPRepetitiveComponentProps };
