import { ProgressProvider } from '@bprogress/next/app';

export function IGRPProgressBar({
  children,
  height = '4px',
  color = 'primary',
  ...args
}: React.ComponentProps<typeof ProgressProvider>) {
  return (
    <ProgressProvider
      height={height}
      color={color}
      options={{ showSpinner: false }}
      shallowRouting
      {...args}
    >
      {children}
    </ProgressProvider>
  );
}
