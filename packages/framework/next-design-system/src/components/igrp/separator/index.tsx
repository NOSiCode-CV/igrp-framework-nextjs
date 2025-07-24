import { Separator } from '@/components/primitives/separator';

interface IGRPSeparatorProps extends React.ComponentProps<typeof Separator> {
  name?: string;
}

function IGRPSeparator({ name, ...props }: IGRPSeparatorProps) {
  return (
    <Separator
      id={name}
      {...props}
    />
  );
}

export { IGRPSeparator };
