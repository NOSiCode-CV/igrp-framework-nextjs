import Link from 'next/link';
import { Button } from '@/components/horizon/button';
import { IGRPIcon, type IGRPIconName } from '@/components/igrp/icon';

interface IGRPPageHeaderBackButtonProps extends React.ComponentProps<typeof Button> {
  url?: string;
  iconName?: IGRPIconName | string;
}
function IGRPPageHeaderBackButton({
  url = '/',
  iconName = 'ArrowLeft',
  ...props
}: IGRPPageHeaderBackButtonProps) {
  return (
    <Button
      variant='outline'
      size='icon'
      asChild
      {...props}
    >
      <Link href={url}>
        <IGRPIcon iconName={iconName} />
      </Link>
    </Button>
  );
}

export { IGRPPageHeaderBackButton, type IGRPPageHeaderBackButtonProps };
