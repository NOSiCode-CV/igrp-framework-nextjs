import { AppProgressProvider } from '@bprogress/next';

function IGRPProgressBarProvider({
  children,
  height = '4px',
  color = 'primary',
  ...args
}: React.ComponentProps<typeof AppProgressProvider>) {
  return (
    <AppProgressProvider
      height={height}
      color={color}
      options={{ showSpinner: false }}
      shallowRouting
      {...args}
    >
      {children}
    </AppProgressProvider>
  );
}

export { IGRPProgressBarProvider }
